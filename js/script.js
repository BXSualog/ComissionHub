'use strict';

const ADMIN_CREDS = { user: 'admin', pass: 'admin123' };

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

function generateUid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const dateObj = new Date(isoString);
  if (isNaN(dateObj.getTime())) return 'N/A';
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function getSession() {
  const response = await API.getSession();
  return response.success ? response.user : null;
}

async function logout() {
  await API.logout();
  window.location.href = 'index.html';
}

function isValidEmail(email) {
  const trimmed = email.trim().toLowerCase();
  return /^[^\s@]+@gmail\.com$/.test(trimmed);
}

function getTheme() { return 'dark'; }
function applyTheme() { document.documentElement.setAttribute('data-theme', 'dark'); }
function toggleTheme() {}

function showToast(message, type = 'info', duration = 3500) {
  const container = $('#toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  
  const toastElement = document.createElement('div');
  toastElement.className = `toast ${type}`;
  toastElement.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
  `;

  container.appendChild(toastElement);

  setTimeout(() => {
    toastElement.classList.add('removing');
    toastElement.addEventListener('animationend', () => toastElement.remove(), { once: true });
  }, duration);
}

function hideLoadingScreen() {
  const screen = $('#loading-screen');
  if (!screen) return;
  setTimeout(() => {
    screen.classList.add('hidden');
    screen.addEventListener('transitionend', () => screen.remove(), { once: true });
  }, 900);
}

function setFieldError(groupId, show) {
  const group = $(`#${groupId}`);
  if (!group) return;
  group.classList.toggle('has-error', show);
}

function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  $$('.animate-on-scroll').forEach(element => observer.observe(element));
}

async function initClientPage() {
  const currentUser = await getSession();
  
  const isLandingPage = !window.location.pathname.includes('dashboard.html') && 
                        !window.location.pathname.includes('commission.html') &&
                        !window.location.pathname.includes('admin.html');
  
  if (currentUser && isLandingPage) {
    window.location.href = 'dashboard.html';
    return;
  }

  const greetingText = $('.greeting-title .gradient-text');
  if (greetingText && currentUser) {
    greetingText.textContent = currentUser.firstName;
  }

  const topNavbar = $('#navbar');
  if (topNavbar) {
    window.addEventListener('scroll', () => {
      topNavbar.classList.toggle('scrolled', window.scrollY > 30);
    });
  }

  const hamburgerIcon = $('#nav-hamburger');
  const mobileMenu    = $('#mobile-menu');
  if (hamburgerIcon && mobileMenu) {
    hamburgerIcon.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburgerIcon.classList.toggle('active', isOpen);
      hamburgerIcon.setAttribute('aria-expanded', isOpen);
    });
    $$('#mobile-menu a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburgerIcon.classList.remove('active');
      });
    });
  }

  $('#theme-toggle')?.addEventListener('click', toggleTheme);
  $('#sidebar-theme-toggle')?.addEventListener('click', toggleTheme);

  const authModal     = $('#auth-modal');
  const checkPanel    = $('#check-email-panel');
  const authSecondPanel = $('#auth-second-step-panel');
  const modalHeading  = $('#modal-heading');
  const continueBtn   = $('#btn-continue');
  const authEmailInput = $('#auth-email');

  let currentAuthEmail = '';

  function openAuthModal(mode = 'check') {
    if (!authModal) return;
    authModal.classList.add('open');
    document.body.style.overflow = 'hidden';

    checkPanel.style.display  = 'none';
    authSecondPanel.style.display = 'none';

    if (mode === 'second') {
      authSecondPanel.style.display = 'block';
      modalHeading.textContent = 'Last Step';
      const fName = $('#su-fname').value;
      const lName = $('#su-lname').value;
      $('#auth-display-name').textContent = fName;
    } else {
      checkPanel.style.display = 'block';
      modalHeading.textContent = 'Get Started';
      setFieldError('fg-su-fname', false);
      setFieldError('fg-su-lname', false);
    }
  }

  function closeAuthModal() {
    if (!authModal) return;
    authModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  $('#modal-close')?.addEventListener('click', closeAuthModal);
  
  authModal?.addEventListener('click', (event) => { 
    if (event.target === authModal) closeAuthModal(); 
  });

  continueBtn?.addEventListener('click', () => {
    const fName = $('#su-fname')?.value.trim();
    const lName = $('#su-lname')?.value.trim();
    
    let isValid = true;
    if (!fName) { setFieldError('fg-su-fname', true); isValid = false; } else setFieldError('fg-su-fname', false);
    if (!lName) { setFieldError('fg-su-lname', true); isValid = false; } else setFieldError('fg-su-lname', false);

    if (isValid) {
      openAuthModal('second');
    }
  });

  $('#back-to-step-1')?.addEventListener('click', (e) => { e.preventDefault(); openAuthModal('check'); });

  $('#mobile-go-dashboard')?.addEventListener('click', (e) => {
    e.preventDefault();
    $('#btn-go-dashboard')?.click();
  });

  $('#btn-go-dashboard')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const user = await getSession();
    if (!user) {
      openAuthModal('check');
    } else {
      window.location.href = 'dashboard.html';
    }
  });

  $('#btn-do-auth')?.addEventListener('click', async () => {
    const fName = $('#su-fname')?.value.trim();
    const lName = $('#su-lname')?.value.trim();
    const email = $('#auth-email')?.value.trim();
    const pw    = $('#auth-password')?.value;
    
    let isValid = true;
    if (!isValidEmail(email)) { setFieldError('fg-auth-email', true); isValid = false; } else setFieldError('fg-auth-email', false);
    if (!pw || pw.length < 6) { setFieldError('fg-auth-pw', true); isValid = false; } else setFieldError('fg-auth-pw', false);
    
    if (!isValid) return;

    const authBtn = $('#btn-do-auth');
    authBtn.disabled = true;
    authBtn.textContent = 'Processing...';

    try {
      // 1. Check if user exists
      const checkRes = await API.checkEmail(email);
      
      if (checkRes.success && checkRes.exists) {
        // 2a. Attempt Login
        const loginRes = await API.login(email, pw);
        if (loginRes.success) {
          closeAuthModal();
          showToast(`Welcome back, ${loginRes.user?.firstName || fName}! 👋`, 'success');
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
        } else {
          const errorText = $('#fg-auth-pw .form-error');
          if (errorText) errorText.textContent = loginRes.message || 'Invalid password.';
          setFieldError('fg-auth-pw', true);
        }
      } else {
        // 2b. Attempt Signup
        const signupRes = await API.signup(fName, lName, email, pw);
        if (signupRes.success) {
          closeAuthModal();
          showToast(`Account created! Welcome, ${fName} 🎉`, 'success');
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
        } else {
          showToast(signupRes.message || 'Signup failed.', 'error');
        }
      }
    } finally {
      authBtn.disabled = false;
      authBtn.textContent = 'Complete ✦';
    }
  });
}

function initAdminPage() {
  const adminLoginView = $('#admin-login-view');
  const adminDashView  = $('#admin-dashboard-view');

  if (!adminLoginView || !adminDashView) return;

  let currentStatusFilter = 'all'; 
  let currentSearchQuery  = '';
  let currentServiceFilter = 'all';
  let currentPageNumber   = 1;
  const ITEMS_PER_PAGE    = 10;

  $('.sidebar-nav')?.addEventListener('click', (event) => {
    const navItem = event.target.closest('.sidebar-nav-item');
    if (!navItem) return;

    const tabId = navItem.id;
    
    $$('.sidebar-nav-item').forEach(element => element.classList.remove('active'));
    navItem.classList.add('active');

    $('#requests-panel').style.display  = 'none';
    $('#wallet-panel').style.display    = 'none';
    $('#users-panel').style.display     = 'none';
    $('#analytics-panel').style.display = 'none';
    $('#admin-stats-row').style.display = 'none';

    if (tabId === 'nav-requests') {
      $('#requests-panel').style.display = 'block';
      $('#admin-stats-row').style.display = 'grid';
      $('#topbar-title').textContent = 'All Requests';
      
      currentStatusFilter = 'all';
      currentServiceFilter = 'all';
      currentSearchQuery = '';
      if ($('#service-filter')) $('#service-filter').value = 'all';
      if ($('#status-filter'))  $('#status-filter').value = 'all';
      if ($('#search-input'))   $('#search-input').value = '';

      currentPageNumber = 1;
      renderAdminTable();
    } 
    else if (tabId === 'nav-wallet') {
      $('#wallet-panel').style.display = 'block';
      $('#topbar-title').textContent = 'E-Wallet';
      renderWalletData();
    } 
    else if (tabId === 'nav-users') {
      $('#users-panel').style.display = 'block';
      $('#topbar-title').textContent = 'User Management';
      renderUsersData();
    }
    else if (tabId === 'nav-analytics') {
      $('#analytics-panel').style.display = 'block';
      $('#topbar-title').textContent = 'Statistics & Analytics';
      renderAnalyticsData();
    }

    if (window.innerWidth <= 900) {
      $('#admin-sidebar')?.classList.remove('open');
    }
  });

  $('#sidebar-toggle')?.addEventListener('click', () => {
    $('#admin-sidebar')?.classList.toggle('open');
  });

  function handleResize() {
    if (window.innerWidth <= 900) {
      $('#sidebar-toggle').style.display = 'flex';
    } else {
      $('#sidebar-toggle').style.display = 'none';
      $('#admin-sidebar')?.classList.remove('open');
    }
  }
  window.addEventListener('resize', handleResize);
  handleResize();

  function revealDashboard() {
    adminLoginView.style.display = 'none';
    adminDashView.style.display  = 'block';
    
    $('#nav-requests')?.click();
    renderTopStats();
  }

  function revealLogin() {
    adminLoginView.style.display = 'block';
    adminDashView.style.display  = 'none';
  }

  function attemptAdminLogin() {
    const email = $('#adm-email')?.value.trim();
    const pw    = $('#adm-pw')?.value;
    const errorMsg = $('#adm-login-error');
    
    let valid = true;
    if (!email) { setFieldError('fg-adm-email', true); valid = false; } else setFieldError('fg-adm-email', false);
    if (!pw)    { setFieldError('fg-adm-pw', true);    valid = false; } else setFieldError('fg-adm-pw', false);
    if (!valid) return;

    if (email === ADMIN_CREDS.user && pw === ADMIN_CREDS.pass) {
      errorMsg.style.display = 'none';
      sessionStorage.setItem('commissionhub_admin', '1');
      revealDashboard();
      showToast('Welcome back, Admin! 🔐', 'success');
    } else {
      errorMsg.style.display = 'block';
      setFieldError('fg-adm-user', false);
      setFieldError('fg-adm-pw', false);
    }
  }

  $('#adm-login-btn')?.addEventListener('click', attemptAdminLogin);
  $$('#fg-adm-email input, #fg-adm-pw input').forEach(input => {
    input.addEventListener('keydown', e => { if (e.key === 'Enter') attemptAdminLogin(); });
  });

  $('#adm-logout-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem('commissionhub_admin');
    revealLogin();
    showToast('Signed out successfully.', 'info');
  });

  if (sessionStorage.getItem('commissionhub_admin') === '1') {
    revealDashboard();
  } else {
    revealLogin();
  }

  $('#status-filter')?.addEventListener('change', e => {
    currentStatusFilter = e.target.value;
    currentPageNumber = 1;
    renderAdminTable();
  });

  $('#search-input')?.addEventListener('input', e => {
    currentSearchQuery = e.target.value.toLowerCase();
    currentPageNumber = 1;
    renderAdminTable();
  });

  $('#service-filter')?.addEventListener('change', e => {
    currentServiceFilter = e.target.value;
    currentPageNumber = 1;
    renderAdminTable();
  });

  $('#btn-clear-all')?.addEventListener('click', () => {
    openConfirmationModal('Delete ALL commission requests from the database? This cannot be undone.', async () => {
      const response = await API.clearAllCommissions();
      if (response.success) {
        renderTopStats();
        currentPageNumber = 1;
        renderAdminTable();
        showToast('All requests cleared from database.', 'warning');
      } else {
        showToast(response.message || 'Clear failed.', 'error');
      }
    });
  });

  const confirmModal = $('#confirm-modal');
  let confirmActionToRun = null;

  function openConfirmationModal(messageText, actionFunction) {
    const msgElement = $('#confirm-modal-msg');
    if (msgElement) msgElement.textContent = messageText;
    confirmActionToRun = actionFunction;
    confirmModal?.classList.add('open');
  }

  function closeConfirmationModal() {
    confirmModal?.classList.remove('open');
    confirmActionToRun = null;
  }

  $('#confirm-modal-close')?.addEventListener('click', closeConfirmationModal);
  $('#confirm-cancel')?.addEventListener('click', closeConfirmationModal);
  
  $('#confirm-ok')?.addEventListener('click', () => {
    if (confirmActionToRun) confirmActionToRun();
    closeConfirmationModal();
  });

  async function renderTopStats() {
    const res = await API.getAllRequests();
    const allRequests = res.success ? res.data : [];
    
    const countPending   = allRequests.filter(req => req.status === 'pending').length;
    const countCompleted = allRequests.filter(req => req.status === 'completed').length;
    
    const completionRate = allRequests.length > 0 
      ? Math.round((countCompleted / allRequests.length) * 100) + '%' 
      : '—';

    if ($('#stat-total'))     $('#stat-total').textContent     = allRequests.length;
    if ($('#stat-pending'))   $('#stat-pending').textContent   = countPending;
    if ($('#stat-completed')) $('#stat-completed').textContent = countCompleted;
    if ($('#stat-rate'))      $('#stat-rate').textContent      = completionRate;
  }

  async function renderAdminTable() {
    const tableBody = $('#requests-tbody');
    if (!tableBody) return;

    const res = await API.getAllRequests();
    let requestsList = res.success ? res.data : [];

    if (currentStatusFilter !== 'all') {
      requestsList = requestsList.filter(req => req.status === currentStatusFilter);
    }

    if (currentServiceFilter !== 'all') {
      requestsList = requestsList.filter(req => req.service_type === currentServiceFilter);
    }

    if (currentSearchQuery) {
      requestsList = requestsList.filter(req => {
        const clientName  = (req.client_name || req.name || '').toLowerCase();
        const clientEmail = (req.client_email || req.email || '').toLowerCase();
        const serviceType = (req.service_type || '').toLowerCase();
        
        return clientName.includes(currentSearchQuery) || 
               clientEmail.includes(currentSearchQuery) || 
               serviceType.includes(currentSearchQuery);
      });
    }

    const totalMatchingItems = requestsList.length;

    if (totalMatchingItems === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="3">
            <div class="empty-state">
              <div class="empty-icon">📂</div>
              <div>No requests found</div>
            </div>
          </td>
        </tr>`;
      buildPaginationControls(0);
      return;
    }

    const startIndex = (currentPageNumber - 1) * ITEMS_PER_PAGE;
    const endIndex   = startIndex + ITEMS_PER_PAGE;
    const itemsForThisPage = requestsList.slice(startIndex, endIndex);

    tableBody.innerHTML = itemsForThisPage.map(req => `
      <tr>
        <td data-label="Client" class="td-clickable td-client-cell" data-id="${escapeHtml(req.order_id)}" title="Click to view full project details">
          <div class="td-name" style="color:var(--text-primary); font-weight:700; pointer-events:none;">
            ${escapeHtml(req.client_name || req.name || 'Unknown User')}
          </div>
          <div class="td-email" style="color:var(--text-muted); pointer-events:none;">
            ${escapeHtml(req.client_email || req.email || 'N/A')}
          </div>
        </td>
        
        <td data-label="Status">
          <span class="badge badge-${req.status === 'completed' ? 'completed' : 'pending'}">
            ${req.status === 'completed' ? '✅ Completed' : '🕐 Pending'}
          </span>
        </td>
        
        <td data-label="Actions">
          <div class="td-actions">
            <button class="btn btn-sm ${req.status === 'completed' ? 'btn-secondary' : 'btn-success'} btn-toggle-status"
              data-id="${escapeHtml(req.order_id)}"
              title="${req.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}">
              ${req.status === 'completed' ? '↩' : '✓'}
            </button>
            
            ${req.status !== 'pending' ? `
            <button class="btn btn-sm btn-danger btn-delete-request"
              data-id="${escapeHtml(req.order_id)}"
              title="Delete Request">
              🗑
            </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    buildPaginationControls(totalMatchingItems);

    $$('.td-client-cell').forEach(cell => {
      cell.addEventListener('click', () => openProjectDetailsModal(cell.dataset.id));
    });

    $$('.btn-toggle-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        toggleProjectStatus(btn.dataset.id);
      });
    });

    $$('.btn-delete-request').forEach(btn => {
      btn.addEventListener('click', (e) => {
        openConfirmationModal('Delete this request permanently?', () => permanentlyDeleteRequest(btn.dataset.id));
      });
    });
  }

  function buildPaginationControls(totalItems) {
    const paginationContainer = $('#pagination-container');
    if (!paginationContainer) return;

    const totalPagesNeeded = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    if (totalPagesNeeded <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let htmlOutput = `
      <button class="pagination-btn" ${currentPageNumber === 1 ? 'disabled' : ''} data-page="${currentPageNumber - 1}">
        &lsaquo;
      </button>
    `;

    for (let pageNum = 1; pageNum <= totalPagesNeeded; pageNum++) {
      if (pageNum === 1 || pageNum === totalPagesNeeded || (pageNum >= currentPageNumber - 2 && pageNum <= currentPageNumber + 2)) {
        
        const isActive = (pageNum === currentPageNumber) ? 'active' : '';
        htmlOutput += `<button class="pagination-btn ${isActive}" data-page="${pageNum}">${pageNum}</button>`;
      
      } else if (pageNum === currentPageNumber - 3 || pageNum === currentPageNumber + 3) {
        htmlOutput += `<span class="pagination-ellipsis">...</span>`;
      }
    }

    htmlOutput += `
      <button class="pagination-btn" ${currentPageNumber === totalPagesNeeded ? 'disabled' : ''} data-page="${currentPageNumber + 1}">
        &rsaquo;
      </button>
    `;

    paginationContainer.innerHTML = htmlOutput;

    $$('.pagination-btn', paginationContainer).forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedPage = parseInt(btn.dataset.page);
        if (!isNaN(selectedPage) && selectedPage !== currentPageNumber) {
          currentPageNumber = selectedPage;
          renderAdminTable();
        }
      });
    });
  }

  const projectDetailsModal = $('#details-modal');

  async function openProjectDetailsModal(orderId) {
    if (!orderId) return;
    
    const response = await API.getAllRequests();
    const allRequests = response.success ? response.data : [];
    
    const specificRequest = allRequests.find(req => req.order_id === orderId);
    
    if (!specificRequest) {
      showToast('Could not find request details.', 'error');
      return;
    }

    if ($('#det-date'))     $('#det-date').textContent     = formatDate(specificRequest.created_at);
    if ($('#det-deadline')) $('#det-deadline').textContent = specificRequest.deadline ? formatDate(specificRequest.deadline) : 'No deadline set';
    if ($('#det-budget'))   $('#det-budget').textContent   = specificRequest.budget_tier || 'N/A';
    if ($('#det-service'))  $('#det-service').textContent  = specificRequest.service_type || 'N/A';
    if ($('#det-details'))  $('#det-details').textContent  = specificRequest.description || 'No description provided.';

    projectDetailsModal?.classList.add('open');
  }

  function closeProjectDetailsModal() {
    projectDetailsModal?.classList.remove('open');
  }

  $('#details-modal-close')?.addEventListener('click', closeProjectDetailsModal);
  $('#details-close-btn')?.addEventListener('click', closeProjectDetailsModal);
  
  projectDetailsModal?.addEventListener('click', event => { 
    if (event.target === projectDetailsModal) closeProjectDetailsModal(); 
  });

  async function toggleProjectStatus(orderId) {
    const response = await API.getAllRequests();
    const allRequests = response.success ? response.data : [];
    const targetRequest = allRequests.find(req => req.order_id === orderId);
    if (!targetRequest) return;
    
    const newStatus = targetRequest.status === 'completed' ? 'pending' : 'completed';
    const numericAmount = parseFloat(targetRequest.budget_amount) || 0;

    const updateResponse = await API.updateStatus(orderId, newStatus, numericAmount);
    
    if (updateResponse.success) {
      renderTopStats();
      renderAdminTable();
      showToast(`Request marked as ${newStatus}.`, 'success');
    } else {
      showToast(updateResponse.message || 'Status update failed.', 'error');
    }
  }

  async function permanentlyDeleteRequest(orderId) {
    const response = await API.deleteCommission(orderId);
    if (response.success) {
      renderTopStats();
      renderAdminTable();
      showToast('Request deleted from database.', 'warning');
    } else {
      showToast(response.message || 'Delete failed.', 'error');
    }
  }

  async function renderWalletData() {
    const tableBody = $('#wallet-history-tbody');
    const totalEarningsEl = $('#wallet-total-balance');
    const totalJobsEl = $('#wallet-completed-count');
    if (!tableBody || !totalEarningsEl || !totalJobsEl) return;

    const response = await API.getWalletHistory();
    const incomeHistory = response.success ? response.data : [];
    
    let calculatedTotal = 0;
    incomeHistory.forEach(record => {
      calculatedTotal += parseFloat(record.amount) || 0;
    });

    totalEarningsEl.textContent = `₱${calculatedTotal.toLocaleString()}`;
    totalJobsEl.textContent = incomeHistory.length;

    if (incomeHistory.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4"><div class="empty-state">No income history found yet.</div></td></tr>`;
      return;
    }

    tableBody.innerHTML = incomeHistory.map(record => `
      <tr>
        <td data-label="Client">
          <div class="td-name">${escapeHtml(record.client_name)}</div>
          <div class="td-email">${escapeHtml(record.client_email)}</div>
        </td>
        <td data-label="Service">${escapeHtml(record.service)}</td>
        <td data-label="Amount" class="td-amount">₱${parseFloat(record.amount).toLocaleString()}</td>
        <td data-label="Date">${formatDate(record.processed_at)}</td>
      </tr>
    `).join('');
  }

  async function renderUsersData() {
    const tableBody = $('#users-tbody');
    if (!tableBody) return;

    const response = await API.getUsers();
    const usersList = response.success ? response.data : [];

    if (usersList.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5"><div class="empty-state">No registered users found.</div></td></tr>`;
      return;
    }

    tableBody.innerHTML = usersList.map((user, index) => `
      <tr>
        <td data-label="No."><span style="font-family:monospace; color:var(--accent);">#${index + 1}</span></td>
        <td data-label="Name"><div class="td-name">${escapeHtml(user.first_name + ' ' + user.last_name)}</div></td>
        <td data-label="Email">${escapeHtml(user.email)}</td>
        <td data-label="Joined">${formatDate(user.created_at)}</td>
        <td data-label="Actions">
          <div class="td-actions">
            <button class="btn btn-sm btn-warning btn-edit-user" 
              data-id="${user.id}" 
              data-fname="${escapeHtml(user.first_name)}" 
              data-lname="${escapeHtml(user.last_name)}" 
              data-email="${escapeHtml(user.email)}">Edit</button>
            <button class="btn btn-sm btn-danger btn-delete-user" data-id="${user.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    $$('.btn-delete-user', tableBody).forEach(btn => {
      btn.addEventListener('click', () => {
        openConfirmationModal('Are you sure you want to delete this user? Their commissions will also be removed.', async () => {
          const res = await API.deleteUser(btn.dataset.id);
          if (res.success) {
            showToast('User deleted successfully.', 'warning');
            renderUsersData();
          } else {
            showToast(res.message || 'Delete failed.', 'error');
          }
        });
      });
    });

    $$('.btn-edit-user', tableBody).forEach(btn => {
      btn.addEventListener('click', () => {
        $('#edit-user-id').value    = btn.dataset.id;
        $('#edit-user-fname').value = btn.dataset.fname;
        $('#edit-user-lname').value = btn.dataset.lname;
        $('#edit-user-email').value = btn.dataset.email;
        $('#edit-user-modal').classList.add('open');
      });
    });
  }

  $('#edit-user-modal-close')?.addEventListener('click', () => $('#edit-user-modal').classList.remove('open'));
  $('#edit-user-cancel')?.addEventListener('click', () => $('#edit-user-modal').classList.remove('open'));
  
  $('#edit-user-save')?.addEventListener('click', async () => {
    const id        = $('#edit-user-id').value;
    const firstName = $('#edit-user-fname').value;
    const lastName  = $('#edit-user-lname').value;
    const email     = $('#edit-user-email').value;

    if (!firstName || !lastName || !email) {
        showToast('Please fill all fields.', 'error');
        return;
    }

    const response = await API.updateUser({ id, firstName, lastName, email });
    if (response.success) {
        showToast('User updated successfully.', 'success');
        $('#edit-user-modal').classList.remove('open');
        renderUsersData();
    } else {
        showToast(response.message || 'Update failed.', 'error');
    }
  });

  async function renderAnalyticsData() {
    const summaryResponse = await API.getAnalyticsSummary();
    const revenueResponse = await API.getRevenueStats();
    const pendingResponse = await API.getPendingSummary();

    if (summaryResponse.success) {
      const stats = summaryResponse.data;
      if ($('#ana-avg-value'))      $('#ana-avg-value').textContent      = `₱${Math.round(stats.avg_order_value).toLocaleString()}`;
      if ($('#ana-top-service'))    $('#ana-top-service').textContent    = stats.top_service || 'None';
      if ($('#ana-active-clients')) $('#ana-active-clients').textContent = stats.active_clients || 0;
    }

    const revenueTable = $('#analytics-revenue-tbody');
    if (revenueTable && revenueResponse.success) {
      revenueTable.innerHTML = revenueResponse.data.map(row => {
        const sharePercent = Math.round(row.share_percentage || 0);
        return `
          <tr>
            <td data-label="Service Type">${escapeHtml(row.service_type)}</td>
            <td data-label="Orders">${row.order_count}</td>
            <td data-label="Total Revenue">₱${parseFloat(row.total_revenue).toLocaleString()}</td>
            <td data-label="Share">
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <div style="flex:1; height:8px; background:var(--bg-card); border-radius:4px; overflow:hidden;">
                  <div style="width:${sharePercent}%; height:100%; background:var(--accent);"></div>
                </div>
                <span>${sharePercent}%</span>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    const pendingTable = $('#analytics-pending-tbody');
    if (pendingTable && pendingResponse.success) {
      if (pendingResponse.data.length === 0) {
        pendingTable.innerHTML = '<tr><td colspan="2"><div class="empty-state">No pending orders.</div></td></tr>';
      } else {
        pendingTable.innerHTML = pendingResponse.data.map(client => `
          <tr>
            <td data-label="Client Name">${escapeHtml(client.name)}</td>
            <td data-label="Pending Requests">
              <span class="badge badge-pending">${client.pending_count}</span>
            </td>
          </tr>
        `).join('');
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  
  applyTheme();
  hideLoadingScreen();
  initScrollAnimations();

  $$('.btn-toggle-password').forEach(button => {
    button.addEventListener('click', () => {
      const inputField = button.previousElementSibling;
      const eyeIcon = button.querySelector('i');
      
      if (inputField && inputField.tagName === 'INPUT') {
        if (inputField.type === 'password') {
          inputField.type = 'text';
          if (eyeIcon) { eyeIcon.classList.remove('fa-eye'); eyeIcon.classList.add('fa-eye-slash'); }
        } else {
          inputField.type = 'password';
          if (eyeIcon) { eyeIcon.classList.remove('fa-eye-slash'); eyeIcon.classList.add('fa-eye'); }
        }
      }
    });
  });

  function initSidebarModals() {
    const recentRequestsModal = $('#recent-requests-modal');
    const recentOpenBtn       = $('#btn-recent-requests');
    const recentCloseBtn      = $('#rr-modal-close');

    const notificationsModal  = $('#notifications-modal');
    const notifOpenBtn        = $('#btn-notifications');
    const notifCloseBtn       = $('#notif-modal-close');

    if (!recentRequestsModal && !notificationsModal) return;

    async function loadRecentRequests() {
      const response = await API.getMyCommissions();
      const myRequests = response.success ? response.data : [];
      const modalBody = recentRequestsModal.querySelector('.modal-body');

      if (myRequests.length === 0) {
        modalBody.innerHTML = `
          <div style="text-align:center; padding:3rem 2rem;">
            <p style="color:var(--text-muted);">You haven't made any requests yet.</p>
            <a href="commission.html" class="btn btn-primary" style="margin-top:1rem">Create your first request ✦</a>
          </div>
        `;
      } else {
        const icons = {
          'Graphics Designing': '🎨', 'Web Designing': '🌐', 'Voice Acting': '🎙️',
          'Photo & Video Editing': '🎬', 'Game Assets Designing': '🎮', 'Other': '✦'
        };

        modalBody.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:1rem;max-height:58vh;overflow-y:auto;">
            ${myRequests.map(req => {
              const iconEmoji = icons[req.service_type] || '✦';
              const isDone = req.status === 'completed';
              const color = isDone ? '#22c55e' : '#f59e0b';
              const text  = isDone ? '✅ Completed' : '🕐 Pending';

              return `
              <div style="position:relative;padding:1.25rem;border:1px solid rgba(143,125,251,0.2);border-radius:14px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:0.9rem;">
                  <span style="font-weight:bold;">${iconEmoji} ${escapeHtml(req.service_type)}</span>
                  <span style="color:${color};font-weight:bold;font-size:0.8rem;">${text}</span>
                </div>
                <div style="font-size:0.85rem;color:var(--text-muted);">
                  <div>Budget: ${escapeHtml(req.budget_tier)}</div>
                  <div>Submitted: ${formatDate(req.created_at)}</div>
                </div>
              </div>`;
            }).join('')}
          </div>
          <a href="commission.html" class="btn btn-primary" style="margin-top:1.25rem;width:100%;">+ Add New Request</a>
        `;
      }
    }

    async function loadNotifications() {
      const response = await API.getNotifications();
      const notificationsList = response.success ? response.data : [];
      const modalBody = notificationsModal.querySelector('.modal-body');
      
      if (notificationsList.length === 0) {
        modalBody.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:2rem;">You have no new notifications.</p>`;
      } else {
        modalBody.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:1rem; overflow-y:auto; max-height:58vh;">
            ${notificationsList.map(n => `
              <div style="padding:1rem;background:rgba(143,125,251,0.06);border-radius:10px;">
                <p style="margin:0 0 0.5rem;font-weight:bold;">${escapeHtml(n.message)}</p>
                <small style="color:var(--text-muted);">${formatDate(n.created_at)}</small>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-sm btn-secondary" id="clear-notifs-btn" style="margin-top: 1.5rem; width: 100%;">Clear Notifications</button>
        `;
        
        $('#clear-notifs-btn')?.addEventListener('click', async () => {
          await API.clearNotifications();
          loadNotifications();
          updateNotificationBadge();
        });
      }
    }

    async function updateNotificationBadge() {
      if (!notifOpenBtn) return;
      const response = await API.getNotifications();
      const notificationsCount = response.success ? response.data.length : 0;
      
      let badge = notifOpenBtn.querySelector('.notif-badge');
      
      if (notificationsCount > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'notif-badge';
          badge.style.cssText = 'position:absolute; top:-4px; right:-4px; background:#f44336; color:#fff; font-size:0.65rem; padding:0.15rem 0.4rem; border-radius:50%; font-weight:bold; line-height:1; pointer-events:none;';
          notifOpenBtn.style.position = 'relative';
          notifOpenBtn.appendChild(badge);
        }
        badge.textContent = notificationsCount;
        badge.style.display = 'block';
      } else if (badge) {
        badge.style.display = 'none';
      }
    }

    updateNotificationBadge();

    const openSidebarModal = async (modal) => {
      if (!modal) return;
      if (modal === notificationsModal) {
         await loadNotifications();
         await updateNotificationBadge();
      }
      if (modal === recentRequestsModal) {
         await loadRecentRequests();
      }
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    const closeSidebarModal = (modal) => {
      if (!modal) return;
      modal.classList.remove('open');
      document.body.style.overflow = '';
    };

    recentOpenBtn?.addEventListener('click', () => openSidebarModal(recentRequestsModal));
    recentCloseBtn?.addEventListener('click', () => closeSidebarModal(recentRequestsModal));
    recentRequestsModal?.addEventListener('click', (e) => { if (e.target === recentRequestsModal) closeSidebarModal(recentRequestsModal); });

    notifOpenBtn?.addEventListener('click', () => openSidebarModal(notificationsModal));
    notifCloseBtn?.addEventListener('click', () => closeSidebarModal(notificationsModal));
    notificationsModal?.addEventListener('click', (e) => { if (e.target === notificationsModal) closeSidebarModal(notificationsModal); });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSidebarModal(recentRequestsModal);
        closeSidebarModal(notificationsModal);
      }
    });
  }

  if ($('#admin-dashboard-view')) {
    initAdminPage();
  } else {
    initClientPage();
    initSidebarModals();
    initServicesCarousel();
    
    $('#btn-sidebar-logout')?.addEventListener('click', logout);
  }
});

function initServicesCarousel() {
  const scrollTrack = $('#services-track');
  const scrollWrapper = $('.services-carousel-wrapper');
  
  if (!scrollTrack || !scrollWrapper) return;

  const originalCards = Array.from(scrollTrack.children);
  if (originalCards.length === 0) return;

  originalCards.forEach(card => {
    card.classList.remove('animate-on-scroll', 'visible');
    card.style.opacity = '1';
    card.style.transform = 'none';
  });

  originalCards.forEach(card => scrollTrack.appendChild(card.cloneNode(true)));
  originalCards.forEach(card => scrollTrack.appendChild(card.cloneNode(true)));

  let currentScrollPosition = 0;
  let isPaused = false;
  let animationFrameId = null;
  const pixelsPerFrame = 0.8;

  const getWidthOfOneSet = () => scrollTrack.scrollWidth / 3;
  let widthOfOneSet = 0;

  function startCarouselAnimation() {
    widthOfOneSet = getWidthOfOneSet();
    
    if (widthOfOneSet === 0) {
      setTimeout(startCarouselAnimation, 100);
      return;
    }
    
    animationFrameId = requestAnimationFrame(moveCarousel);
  }

  window.addEventListener('resize', () => { widthOfOneSet = getWidthOfOneSet(); });

  function moveCarousel() {
    if (isPaused) return;

    currentScrollPosition += pixelsPerFrame;
    
    if (currentScrollPosition >= widthOfOneSet) {
      currentScrollPosition = 0;
    }

    scrollTrack.style.transform = `translateX(${-currentScrollPosition}px)`;
    
    animationFrameId = requestAnimationFrame(moveCarousel);
  }

  setTimeout(startCarouselAnimation, 200);

  scrollTrack.addEventListener('click', (event) => {
    const clickedCard = event.target.closest('.service-card');
    if (!clickedCard) return;

    if (clickedCard.classList.contains('active-card')) {
      resumeCarouselScrolling();
    } else {
      snapAndHighlightCard(clickedCard);
    }
  });

  function snapAndHighlightCard(card) {
    isPaused = true;
    cancelAnimationFrame(animationFrameId);

    const cardRect = card.getBoundingClientRect();
    const wrapperRect = scrollWrapper.getBoundingClientRect();
    
    const cardCenterPixel = cardRect.left + cardRect.width / 2;
    const wrapperCenterPixel = wrapperRect.left + wrapperRect.width / 2;
    
    const difference = wrapperCenterPixel - cardCenterPixel;

    scrollTrack.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)';
    scrollTrack.style.transform = `translateX(${-currentScrollPosition + difference}px)`;
    
    $$('.service-card').forEach(c => c.classList.remove('active-card'));
    card.classList.add('active-card');
  }

  function resumeCarouselScrolling() {
    if (!isPaused) return;
    
    scrollTrack.style.transition = 'transform 0.5s ease-in-out';
    scrollTrack.style.transform = `translateX(${-currentScrollPosition}px)`;
    
    $$('.service-card').forEach(c => c.classList.remove('active-card'));

    setTimeout(() => {
      scrollTrack.style.transition = 'none';
      isPaused = false;
      animationFrameId = requestAnimationFrame(moveCarousel);
    }, 500);
  }

  scrollWrapper.addEventListener('click', (event) => {
    if (event.target === scrollWrapper || event.target === scrollTrack) {
      resumeCarouselScrolling();
    }
  });
}
