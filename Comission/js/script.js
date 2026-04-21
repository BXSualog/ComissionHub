'use strict';

const ADMIN_CREDS = { user: 'admin', pass: 'admin123' };

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(iso) {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


async function getSession() {
  const res = await API.getSession();
  return res.success ? res.user : null;
}


async function logout() {
  await API.logout();
  window.location.href = 'index.html';
}


function getTheme() {
  return 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', 'dark');
}

function toggleTheme() {
}

function showToast(message, type = 'info', duration = 3500) {
  const container = $('#toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
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

function setError(groupId, show) {
  const group = $(`#${groupId}`);
  if (!group) return;
  group.classList.toggle('has-error', show);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  $$('.animate-on-scroll').forEach(el => observer.observe(el));
}

async function initClientPage() {
  const session = await getSession();
  
  // Update greeting if on dashboard
  const greetingSpan = $('.greeting-title .gradient-text');
  if (greetingSpan && session) {
    greetingSpan.textContent = session.name;
  }
  const navbar = $('#navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    });
  }

  const hamburger = $('#nav-hamburger');
  const mobileMenu = $('#mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('active', open);
      hamburger.setAttribute('aria-expanded', open);
    });
    $$('#mobile-menu a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });
  }

  const themeBtn = $('#theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  const sidebarThemeBtn = $('#sidebar-theme-toggle');
  if (sidebarThemeBtn) sidebarThemeBtn.addEventListener('click', toggleTheme);

  const authModal    = $('#auth-modal');
  const loginPanel   = $('#login-panel');
  const signupPanel  = $('#signup-panel');
  const modalHeading = $('#modal-heading');

  function openModal(mode = 'login') {
    if (!authModal) return;
    authModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (mode === 'signup') {
      loginPanel.style.display = 'none';
      signupPanel.style.display = 'block';
      modalHeading.textContent = 'Create Account';
    } else {
      loginPanel.style.display = 'block';
      signupPanel.style.display = 'none';
      modalHeading.textContent = 'Welcome Back';
    }
  }

  function closeModal() {
    if (!authModal) return;
    authModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  $('#btn-login')?.addEventListener('click', () => openModal('login'));
  $('#btn-signup')?.addEventListener('click', () => openModal('signup'));
  $('#mobile-login')?.addEventListener('click', (e) => { e.preventDefault(); openModal('login'); });
  $('#modal-close')?.addEventListener('click', closeModal);
  authModal?.addEventListener('click', e => { if (e.target === authModal) closeModal(); });

  $('#go-to-signup')?.addEventListener('click', (e) => { e.preventDefault(); openModal('signup'); });
  $('#go-to-login')?.addEventListener('click', (e) => { e.preventDefault(); openModal('login'); });

  $('#btn-go-dashboard')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const session = await getSession();
    if (!session) {
      openModal('login');
      showToast('Please sign in to access your dashboard.', 'info');
    } else {
      window.location.href = 'dashboard.html';
    }
  });

  $('#btn-do-login')?.addEventListener('click', async () => {
    const email = $('#login-email')?.value.trim();
    const pw    = $('#login-password')?.value;
    let valid = true;

    if (!validateEmail(email)) { setError('fg-login-email', true); valid = false; }
    else setError('fg-login-email', false);

    if (!pw) { setError('fg-login-pw', true); valid = false; }
    else setError('fg-login-pw', false);

    if (!valid) return;

    const res = await API.login(email, pw);
    if (!res.success) {
      setError('fg-login-email', true);
      const err = $('#fg-login-email .form-error');
      if (err) err.textContent = res.message || 'Invalid email or password.';
      return;
    }

    closeModal();
    showToast(`Welcome back, ${res.user.name}! 👋`, 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  });

  $('#btn-do-signup')?.addEventListener('click', async () => {
    const name  = $('#su-name')?.value.trim();
    const email = $('#su-email')?.value.trim();
    const pw    = $('#su-password')?.value;
    let valid   = true;

    if (!name) { setError('fg-su-name', true); valid = false; }
    else setError('fg-su-name', false);

    if (!validateEmail(email)) { setError('fg-su-email', true); valid = false; }
    else setError('fg-su-email', false);

    if (!pw || pw.length < 6) { setError('fg-su-pw', true); valid = false; }
    else setError('fg-su-pw', false);

    if (!valid) return;

    const res = await API.signup(name, email, pw);
    if (!res.success) {
      setError('fg-su-email', true);
      const err = $('#fg-su-email .form-error');
      if (err) err.textContent = res.message || 'Signup failed.';
      return;
    }

    closeModal();
    showToast(`Account created! Welcome, ${res.user.name} 🎉`, 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  });

}

function initAdminPage() {
  const loginView     = $('#admin-login-view');
  const dashboardView = $('#admin-dashboard-view');

  if (!loginView || !dashboardView) return;

  // Centralized Sidebar Navigation Handler
  $('.sidebar-nav')?.addEventListener('click', (e) => {
    const item = e.target.closest('.sidebar-nav-item');
    if (!item) return;

    const id = item.id;
    $$('.sidebar-nav-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');

    // Hide all panels first
    $('#requests-panel').style.display = 'none';
    $('#wallet-panel').style.display = 'none';
    $('#users-panel').style.display = 'none';
    $('#admin-stats-row').style.display = 'none';

    if (id === 'nav-requests') {
      $('#requests-panel').style.display = 'block';
      $('#admin-stats-row').style.display = 'grid';
      $('#topbar-title').textContent = 'All Requests';
      
      // Reset filters
      currentFilter = 'all';
      serviceFilter = 'all';
      searchQuery = '';
      if ($('#service-filter')) $('#service-filter').value = 'all';
      if ($('#status-filter')) $('#status-filter').value = 'all';
      if ($('#search-input')) $('#search-input').value = '';

      currentPage = 1;
      renderTable();
    } 
    else if (id === 'nav-wallet') {
      $('#wallet-panel').style.display = 'block';
      $('#topbar-title').textContent = 'E-Wallet';
      renderWalletContent();
    } 
    else if (id === 'nav-users') {
      $('#users-panel').style.display = 'block';
      $('#topbar-title').textContent = 'User Management';
      renderUsersContent();
    }

    // Close sidebar on mobile
    if (window.innerWidth <= 900) {
      adminSidebar?.classList.remove('open');
    }
  });

  $('#adm-theme-toggle')?.addEventListener('click', toggleTheme);

  const sidebarToggle = $('#sidebar-toggle');
  const adminSidebar  = $('#admin-sidebar');

  function checkSidebarMode() {
    if (window.innerWidth <= 900) {
      sidebarToggle.style.display = 'flex';
    } else {
      sidebarToggle.style.display = 'none';
      adminSidebar?.classList.remove('open');
    }
  }

  sidebarToggle?.addEventListener('click', () => {
    adminSidebar?.classList.toggle('open');
  });

  window.addEventListener('resize', checkSidebarMode);
  checkSidebarMode();

  let currentFilter = 'all'; 
  let searchQuery   = '';
  let serviceFilter = 'all';
  let currentPage   = 1;
  const itemsPerPage = 10;

  function showDashboard() {
    loginView.style.display = 'none';
    dashboardView.style.display = 'block';
    
    // Reset to requests view
    $('#requests-panel').style.display = 'block';
    $('#wallet-panel').style.display = 'none';
    $('#users-panel').style.display = 'none';
    $('#admin-stats-row').style.display = 'grid';
    $('#topbar-title').textContent = 'All Requests';
    
    $$('.sidebar-nav-item').forEach(el => el.classList.remove('active'));
    $('#nav-requests')?.classList.add('active');

    renderStats();
    currentPage = 1;
    renderTable();
  }

  function showLogin() {
    loginView.style.display = 'block';
    dashboardView.style.display = 'none';
  }

  const admLoginBtn = $('#adm-login-btn');
  const admLoginErr = $('#adm-login-error');

  function doAdminLogin() {
    const user = $('#adm-user')?.value.trim();
    const pw   = $('#adm-pw')?.value;
    let valid  = true;

    if (!user) { setError('fg-adm-user', true); valid = false; } else setError('fg-adm-user', false);
    if (!pw)   { setError('fg-adm-pw', true);   valid = false; } else setError('fg-adm-pw', false);

    if (!valid) return;

    if (user === ADMIN_CREDS.user && pw === ADMIN_CREDS.pass) {
      admLoginErr.style.display = 'none';
      sessionStorage.setItem('commissionhub_admin', '1');
      showDashboard();
      showToast('Welcome back, Admin! 🔐', 'success');
    } else {
      admLoginErr.style.display = 'block';
      setError('fg-adm-user', false);
      setError('fg-adm-pw', false);
    }
  }

  admLoginBtn?.addEventListener('click', doAdminLogin);
  $$('#fg-adm-user input, #fg-adm-pw input').forEach(input => {
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doAdminLogin(); });
  });

  if (sessionStorage.getItem('commissionhub_admin') === '1') {
    showDashboard();
  } else {
    showLogin();
  }

  $('#adm-logout-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem('commissionhub_admin');
    showLogin();
    showToast('Signed out successfully.', 'info');
  });

  $('#status-filter')?.addEventListener('change', e => {
    currentFilter = e.target.value;
    currentPage = 1;
    renderTable();
  });

  $('#search-input')?.addEventListener('input', e => {
    searchQuery = e.target.value.toLowerCase();
    currentPage = 1;
    renderTable();
  });

  $('#service-filter')?.addEventListener('change', e => {
    serviceFilter = e.target.value;
    currentPage = 1;
    renderTable();
  });

  $('#btn-clear-all')?.addEventListener('click', () => {
    openConfirm('Delete ALL commission requests from the database? This cannot be undone.', async () => {
      const res = await API.clearAllCommissions();
      if (res.success) {
        renderStats();
        currentPage = 1;
        renderTable();
        showToast('All requests cleared from database.', 'warning');
      } else {
        showToast(res.message || 'Clear failed.', 'error');
      }
    });
  });

  const confirmModal = $('#confirm-modal');
  let confirmCallback = null;

  function openConfirm(message, onOk) {
    const msg = $('#confirm-modal-msg');
    if (msg) msg.textContent = message;
    confirmCallback = onOk;
    confirmModal?.classList.add('open');
  }

  function closeConfirm() {
    confirmModal?.classList.remove('open');
    confirmCallback = null;
  }

  $('#confirm-modal-close')?.addEventListener('click', closeConfirm);
  $('#confirm-cancel')?.addEventListener('click', closeConfirm);
  confirmModal?.addEventListener('click', e => { if (e.target === confirmModal) closeConfirm(); });

  $('#confirm-ok')?.addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeConfirm();
  });

  async function renderStats(requests = null) {
    if (!requests) {
      const res = await API.getAllRequests();
      requests = res.success ? res.data : [];
    }
    const pending   = requests.filter(r => r.status === 'pending').length;
    const completed = requests.filter(r => r.status === 'completed').length;
    const rate      = requests.length > 0 ? Math.round((completed / requests.length) * 100) + '%' : '—';

    const statTotal     = $('#stat-total');
    const statPending   = $('#stat-pending');
    const statCompleted = $('#stat-completed');
    const statRate      = $('#stat-rate');

    if (statTotal)     statTotal.textContent     = requests.length;
    if (statPending)   statPending.textContent   = pending;
    if (statCompleted) statCompleted.textContent = completed;
    if (statRate)      statRate.textContent      = rate;
  }

  async function renderTable() {
    const tbody = $('#requests-tbody');
    if (!tbody) return;

    const res = await API.getAllRequests();
    let requests = res.success ? res.data : [];

    if (currentFilter !== 'all') {
      requests = requests.filter(r => r.status === currentFilter);
    }

    if (serviceFilter !== 'all') {
      requests = requests.filter(r => r.service_type === serviceFilter);
    }

    if (searchQuery) {
      requests = requests.filter(r => {
        const name  = (r.client_name || r.name || '').toLowerCase();
        const email = (r.client_email || r.email || '').toLowerCase();
        const serv  = (r.service_type || '').toLowerCase();
        return name.includes(searchQuery) || email.includes(searchQuery) || serv.includes(searchQuery);
      });
    }

    console.log("Admin Data Loading:", requests); // Debug
    if (requests.length > 0) console.table(requests);

    const totalItems = requests.length;

    if (totalItems === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3">
            <div class="empty-state">
              <div class="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
              </div>
              <div>No requests found</div>
            </div>
          </td>
        </tr>`;
      renderPagination(0);
      return;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end   = start + itemsPerPage;
    const paginatedItems = requests.slice(start, end);

    tbody.innerHTML = paginatedItems.map(r => `
      <tr data-id="${escapeHtml(r.order_id)}">
        <td data-label="Client" class="td-clickable td-client-cell" data-id="${escapeHtml(r.order_id)}" title="Click to view full project details">
          <div class="td-name" style="color:var(--text-primary) !important; font-weight:700 !important; display:block !important; pointer-events:none;">
            ${escapeHtml(r.client_name || r.name || 'Unknown User')}
          </div>
          <div class="td-email" style="color:var(--text-muted) !important; display:block !important; pointer-events:none;">
            ${escapeHtml(r.client_email || r.email || 'N/A')}
          </div>
        </td>
        <td data-label="Status">
          <span class="badge badge-${r.status === 'completed' ? 'completed' : 'pending'}">
            ${r.status === 'completed' ? '✅ Completed' : '🕐 Pending'}
          </span>
        </td>
        <td data-label="Actions">
          <div class="td-actions">
            <button class="btn btn-sm ${r.status === 'completed' ? 'btn-secondary' : 'btn-success'} btn-toggle-status"
              data-id="${escapeHtml(r.order_id)}"
              title="${r.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}">
              ${r.status === 'completed' ? '↩' : '✓'}
            </button>
            <button class="btn btn-sm btn-danger btn-delete-request"
              data-id="${escapeHtml(r.order_id)}"
              title="Delete Request">
              🗑
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    renderPagination(totalItems);

    $$('.td-client-cell').forEach(cell => {
      cell.addEventListener('click', () => openDetails(cell.dataset.id));
    });

    $$('.btn-toggle-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStatus(btn.dataset.id);
      });
    });

    $$('.btn-delete-request').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openConfirm('Delete this request permanently?', () => deleteRequest(btn.dataset.id));
      });
    });
  }

  function renderPagination(totalItems) {
    const container = $('#pagination-container');
    if (!container) return;

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = `
      <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}" title="Previous">
        &lsaquo;
      </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
        html += `
          <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
            ${i}
          </button>
        `;
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        html += `<span class="pagination-ellipsis">...</span>`;
      }
    }

    html += `
      <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}" title="Next">
        &rsaquo;
      </button>
    `;

    container.innerHTML = html;

    $$('.pagination-btn', container).forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (!isNaN(page) && page !== currentPage) {
          currentPage = page;
          renderTable();
          
          $('.admin-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  const detailsModal = $('#details-modal');

  async function openDetails(id) {
    if (!id) return;
    const res = await API.getAllRequests();
    const requests = res.success ? res.data : [];
    const req = requests.find(r => r.order_id === id);
    if (!req) {
      showToast('Could not find request details.', 'error');
      return;
    }

    console.log("Opening Details for:", req.order_id);

    // Populate Fields with fallbacks
    $('#det-date').textContent     = formatDate(req.created_at);
    $('#det-deadline').textContent = req.deadline ? formatDate(req.deadline) : 'No deadline set';
    $('#det-budget').textContent   = req.budget_tier || 'N/A';
    $('#det-service').textContent  = req.service_type || 'N/A';
    $('#det-details').textContent  = req.description || 'No description provided.';

    detailsModal?.classList.add('open');
  }

  function closeDetails() {
    detailsModal?.classList.remove('open');
  }

  $('#details-modal-close')?.addEventListener('click', closeDetails);
  $('#details-close-btn')?.addEventListener('click', closeDetails);
  detailsModal?.addEventListener('click', e => { if (e.target === detailsModal) closeDetails(); });

  async function toggleStatus(id) {
    const resReq = await API.getAllRequests();
    const requests = resReq.success ? resReq.data : [];
    const req = requests.find(r => r.order_id === id);
    if (!req) return;
    
    const newStatus = req.status === 'completed' ? 'pending' : 'completed';
    
    // Use the pre-stored numeric amount from the database
    const amount = parseFloat(req.budget_amount) || 0;

    const res = await API.updateStatus(id, newStatus, amount);
    
    if (res.success) {
      renderStats();
      renderTable();
      
      if ($('#nav-wallet')?.classList.contains('active')) {
        renderWalletContent();
      }

      showToast(`Request marked as ${newStatus}.`, 'success');
    } else {
      showToast(res.message || 'Status update failed.', 'error');
    }
  }

  function parseBudget(str) {
    if (!str) return 0;
    const match = str.match(/[₱$](\d{1,3}(,\d{3})*)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, '')) || 0;
    }
    const numOnly = str.match(/\d+/);
    return numOnly ? parseInt(numOnly[0]) : 0;
  }

  async function renderWalletContent() {
    const tbody = $('#wallet-history-tbody');
    const totalEl = $('#wallet-total-balance');
    const countEl = $('#wallet-completed-count');
    if (!tbody || !totalEl || !countEl) return;

    const res = await API.getWalletHistory();
    const history = res.success ? res.data : [];
    
    let totalIncome = 0;
    history.forEach(h => {
      totalIncome += parseFloat(h.amount) || 0;
    });

    totalEl.textContent = `₱${totalIncome.toLocaleString()}`;
    countEl.textContent = history.length;

    if (history.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4">
            <div class="empty-state">
              <div class="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path></svg>
              </div>
              <div>No income history found yet.</div>
            </div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = history.map(h => `
      <tr>
        <td data-label="Client">
          <div class="td-name">${escapeHtml(h.client_name)}</div>
          <div class="td-email">${escapeHtml(h.client_email)}</div>
        </td>
        <td data-label="Service">${escapeHtml(h.service)}</td>
        <td data-label="Amount" class="td-amount">₱${parseFloat(h.amount).toLocaleString()}</td>
        <td data-label="Date">${formatDate(h.processed_at)}</td>
      </tr>
    `).join('');
  }

  async function renderUsersContent() {
    const tbody = $('#users-tbody');
    if (!tbody) return;

    const res = await API.getUsers();
    const users = res.success ? res.data : [];

    if (users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <div class="empty-icon">👤</div>
              <div>No registered users found.</div>
            </div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td data-label="ID">
          <span style="font-family: monospace; font-weight: 600; color: var(--accent); opacity: 0.8;">#${u.id}</span>
        </td>
        <td data-label="Name">
          <div class="td-name">${escapeHtml(u.name)}</div>
        </td>
        <td data-label="Email">${escapeHtml(u.email)}</td>
        <td data-label="Joined">${formatDate(u.created_at)}</td>
        <td data-label="Actions">
          <div class="td-actions">
            <button class="btn btn-sm btn-edit-user btn-warning" data-id="${u.id}" data-name="${escapeHtml(u.name)}" data-email="${escapeHtml(u.email)}" title="Edit User">Edit</button>
            <button class="btn btn-sm btn-delete-user btn-danger" data-id="${u.id}" title="Delete User">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach listeners
    tbody.querySelectorAll('.btn-delete-user').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        openConfirm('Are you sure you want to delete this user? This cannot be undone.', async () => {
          const res = await API.deleteUser(id);
          if (res.success) {
            showToast('User deleted successfully.', 'warning');
            renderUsersContent();
          } else {
            showToast(res.message || 'Delete failed.', 'error');
          }
        });
      });
    });

    tbody.querySelectorAll('.btn-edit-user').forEach(btn => {
      btn.addEventListener('click', () => {
        const { id, name, email } = btn.dataset;
        $('#edit-user-id').value = id;
        $('#edit-user-name').value = name;
        $('#edit-user-email').value = email;
        $('#edit-user-modal').classList.add('open');
      });
    });
  }

  // Edit User Modal Handling
  $('#edit-user-modal-close')?.addEventListener('click', () => $('#edit-user-modal').classList.remove('open'));
  $('#edit-user-cancel')?.addEventListener('click', () => $('#edit-user-modal').classList.remove('open'));
  $('#edit-user-save')?.addEventListener('click', async () => {
    const id = $('#edit-user-id').value;
    const name = $('#edit-user-name').value;
    const email = $('#edit-user-email').value;

    if (!name || !email) {
        showToast('Please fill all fields.', 'error');
        return;
    }

    const res = await API.updateUser({ id, name, email });
    if (res.success) {
        showToast('User updated successfully.', 'success');
        $('#edit-user-modal').classList.remove('open');
        renderUsersContent();
    } else {
        showToast(res.message || 'Update failed.', 'error');
    }
  });

  async function deleteRequest(id) {
    const res = await API.deleteCommission(id);
    if (res.success) {
      renderStats();
      renderTable();
      showToast('Request deleted from database.', 'warning');
    } else {
      showToast(res.message || 'Delete failed.', 'error');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getTheme());
  hideLoadingScreen();
  initScrollAnimations();

  $$('.btn-toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      const icon = btn.querySelector('i');
      if (input && input.tagName === 'INPUT') {
        if (input.type === 'password') {
          input.type = 'text';
          if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
          }
        } else {
          input.type = 'password';
          if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
          }
        }
      }
    });
  });

  function initSidebarModals() {
    const rrModal = $('#recent-requests-modal');
    const rrOpenBtn = $('#btn-recent-requests');
    const rrCloseBtn = $('#rr-modal-close');

    const notifModal = $('#notifications-modal');
    const notifOpenBtn = $('#btn-notifications');
    const notifCloseBtn = $('#notif-modal-close');

    if (!rrModal && !notifModal) return;

    async function populateRecentRequests() {
      const res = await API.getMyCommissions();
      const requests = res.success ? res.data : [];
      const rrBody = rrModal.querySelector('.modal-body');

      if (requests.length === 0) {
        rrBody.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem 2rem;text-align:center;gap:0.75rem;">
            <span style="font-size:3rem;opacity:0.5;">📂</span>
            <p style="color:var(--text-muted);font-size:1rem;">You haven't made any requests yet.</p>
            <a href="commission.html" class="btn btn-primary" style="margin-top:1rem">Create your first request ✦</a>
          </div>
        `;
      } else {
        const serviceIcons = {
          'Graphics Designing': '🎨',
          'Web Designing': '🌐',
          'Voice Acting': '🎙️',
          'Photo & Video Editing': '🎬',
          'Game Assets Designing': '🎮',
          'Other': '✦'
        };

        rrBody.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:1rem;max-height:58vh;overflow-y:auto;padding-right:4px;">
            ${requests.map(r => {
              const icon = serviceIcons[r.service_type] || '✦';
              const isCompleted = r.status === 'completed';
              const statusColor = isCompleted ? '#22c55e' : '#f59e0b';
              const statusBg   = isCompleted ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)';
              const statusBorder = isCompleted ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)';
              const statusText = isCompleted ? '✅ Completed' : '🕐 Pending';
              return `
              <div style="position:relative;padding:1.25rem 1.25rem 1.25rem 1.6rem;background:rgba(143,125,251,0.06);border:1px solid rgba(143,125,251,0.2);border-radius:14px;overflow:hidden;transition:all 0.25s ease;">
                <div style="position:absolute;top:0;left:0;width:3px;height:100%;background:linear-gradient(135deg,#8f7dfb,#db8af5);border-radius:3px 0 0 3px;"></div>

                <!-- Header: Service + Badge -->
                <div style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:0.9rem;">
                  <div style="display:flex;align-items:center;gap:0.6rem;">
                    <span style="font-size:1.4rem;line-height:1;">${icon}</span>
                    <span style="font-family:'Outfit',sans-serif;font-weight:700;font-size:0.95rem;color:var(--text-primary);">${escapeHtml(r.service_type || 'Commission Request')}</span>
                  </div>
                  <span style="display:inline-flex;align-items:center;gap:0.3rem;padding:0.25rem 0.7rem;border-radius:999px;font-size:0.72rem;font-weight:600;color:${statusColor};background:${statusBg};border:1px solid ${statusBorder};white-space:nowrap;">${statusText}</span>
                </div>

                <!-- Meta grid: Budget / Deadline / Submitted -->
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.6rem;margin-bottom:${r.description ? '0.9rem' : '0'};">
                  <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:0.5rem 0.65rem;">
                    <div style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.2rem;">💰 Budget</div>
                    <div style="font-size:0.82rem;font-weight:600;color:var(--text-primary);">${escapeHtml(r.budget_tier || 'N/A')}</div>
                  </div>
                  <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:0.5rem 0.65rem;">
                    <div style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.2rem;">📅 Deadline</div>
                    <div style="font-size:0.82rem;font-weight:600;color:var(--text-primary);">${r.deadline ? formatDate(r.deadline) : 'Not set'}</div>
                  </div>
                  <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:0.5rem 0.65rem;">
                    <div style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.2rem;">🗓 Submitted</div>
                    <div style="font-size:0.82rem;font-weight:600;color:var(--text-primary);">${formatDate(r.created_at)}</div>
                  </div>
                </div>

                ${r.description ? `
                <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:0.75rem;font-size:0.82rem;color:var(--text-muted);line-height:1.6;">
                  ${escapeHtml(r.description.substring(0, 140))}${r.description.length > 140 ? '…' : ''}
                </div>` : ''}
              </div>
              `;
            }).join('')}
          </div>
          <a href="commission.html" class="btn btn-primary" style="margin-top:1.25rem;width:100%;justify-content:center;font-size:0.9rem;">+ Add New Request</a>
        `;
      }
    }

    async function populateNotifications() {
      const res = await API.getNotifications();
      const notifs = res.success ? res.data : [];
      const notifBody = notifModal.querySelector('.modal-body');
      
      if (notifs.length === 0) {
        notifBody.innerHTML = `
          <div class="rr-empty-state">
            <i class="fa-solid fa-bell-slash rr-empty-icon" style="opacity: 0.5;"></i>
            <p>You have no new notifications.</p>
          </div>
        `;
      } else {
        notifBody.innerHTML = `
          <div class="notifications-list" style="display:flex;flex-direction:column;gap:1rem; overflow-y:auto; max-height:60vh; padding-right:5px;">
            ${notifs.map(n => `
              <div class="notification-item" style="padding: 1rem; border-radius: var(--radius-md); background: rgba(255,255,255,0.05); border-left: 3px solid transparent; transition: transform 0.2s ease;">
                <p style="margin-bottom:0.5rem; color: #fff; font-size: 0.95rem;">${escapeHtml(n.message)}</p>
                <small style="color:var(--text-muted); font-size: 0.8rem;">${formatDate(n.created_at)}</small>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-sm btn-secondary" id="clear-notifs-btn" style="margin-top: 1.5rem; width: 100%;">Clear Notifications</button>
        `;
        
        const clearBtn = document.getElementById('clear-notifs-btn');
        if (clearBtn) clearBtn.addEventListener('click', async () => {
          await API.clearNotifications();
          populateNotifications();
          updateNotificationBadge();
        });
      }
    }

    async function updateNotificationBadge() {
      const res = await API.getNotifications();
      const notifs = res.success ? res.data : [];
      // No read status in DB yet, but we'll show count if any exist
      const unreadCount = notifs.length;
      if (!notifOpenBtn) return;
      
      let badge = notifOpenBtn.querySelector('.notif-badge');
      if (unreadCount > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'notif-badge';
          badge.style.cssText = 'position:absolute; top:-4px; right:-4px; background:#f44336; color:#fff; font-size:0.65rem; padding:0.15rem 0.4rem; border-radius:50%; font-weight:bold; line-height: 1; pointer-events:none; box-shadow: 0 0 5px rgba(244,67,54,0.5);';
          notifOpenBtn.style.position = 'relative';
          notifOpenBtn.appendChild(badge);
        }
        badge.textContent = unreadCount;
        badge.style.display = 'block';
      } else if (badge) {
        badge.style.display = 'none';
      }
    }

    updateNotificationBadge();

    const openM = async (modal) => {
      if (!modal) return;
      if (modal === notifModal) {
         await populateNotifications();
         // No read status in DB yet, we just show them
         await updateNotificationBadge();
      }
      if (modal === rrModal) {
         await populateRecentRequests();
      }
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    const closeM = (modal) => {
      if (!modal) return;
      modal.classList.remove('open');
      document.body.style.overflow = '';
    };

    rrOpenBtn?.addEventListener('click', () => openM(rrModal));
    rrCloseBtn?.addEventListener('click', () => closeM(rrModal));
    rrModal?.addEventListener('click', (e) => { if (e.target === rrModal) closeM(rrModal); });

    notifOpenBtn?.addEventListener('click', () => openM(notifModal));
    notifCloseBtn?.addEventListener('click', () => closeM(notifModal));
    notifModal?.addEventListener('click', (e) => { if (e.target === notifModal) closeM(notifModal); });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeM(rrModal);
        closeM(notifModal);
      }
    });
  }

  if ($('#admin-dashboard-view')) {
    initAdminPage();
  } else {
    initClientPage();
    initSidebarModals();
    initServicesCarousel();
    
    $('#btn-sidebar-logout')?.addEventListener('click', async () => {
      await API.logout();
      window.location.href = 'index.html';
    });
  }
});

function initServicesCarousel() {
  const track = $('#services-track');
  const wrapper = $('.services-carousel-wrapper');
  if (!track || !wrapper) return;

  const originalCards = Array.from(track.children);
  if (originalCards.length === 0) return;

  originalCards.forEach(card => {
    card.classList.remove('animate-on-scroll', 'visible');
    card.style.opacity = '1';
    card.style.transform = 'none';
  });

  originalCards.forEach(card => {
    const clone = card.cloneNode(true);
    track.appendChild(clone);
  });
  originalCards.forEach(card => {
    const clone = card.cloneNode(true);
    track.appendChild(clone);
  });

  let scrollPos = 0;
  let isPaused = false;
  let animationId = null;
  const speed = 0.8;

  const getOneSetWidth = () => {
    return track.scrollWidth / 3;
  };

  let oneSetWidth = 0;

  function startCarousel() {
    oneSetWidth = getOneSetWidth();
    if (oneSetWidth === 0) {
      setTimeout(startCarousel, 100);
      return;
    }
    animationId = requestAnimationFrame(step);
  }

  window.addEventListener('resize', () => { oneSetWidth = getOneSetWidth(); });

  function step() {
    if (isPaused) return;

    scrollPos += speed;
    if (scrollPos >= oneSetWidth) {
      scrollPos = 0;
    }

    track.style.transform = `translateX(${-scrollPos}px)`;
    animationId = requestAnimationFrame(step);
  }

  setTimeout(startCarousel, 200);

  track.addEventListener('click', (e) => {
    const card = e.target.closest('.service-card');
    if (!card) return;

    if (card.classList.contains('active-card')) {
      resumeCarousel();
    } else {
      snapToCard(card);
    }
  });

  function snapToCard(card) {
    isPaused = true;
    cancelAnimationFrame(animationId);

    const cardRect = card.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    const cardCenter = cardRect.left + cardRect.width / 2;
    const wrapperCenter = wrapperRect.left + wrapperRect.width / 2;
    const offsetToCenter = wrapperCenter - cardCenter;

    track.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)';
    track.style.transform = `translateX(${-scrollPos + offsetToCenter}px)`;
    
    $$('.service-card').forEach(c => c.classList.remove('active-card'));
    card.classList.add('active-card');
  }

  function resumeCarousel() {
    if (!isPaused) return;
    
    track.style.transition = 'transform 0.5s ease-in-out';
    track.style.transform = `translateX(${-scrollPos}px)`;
    
    $$('.service-card').forEach(c => c.classList.remove('active-card'));

    setTimeout(() => {
      track.style.transition = 'none';
      isPaused = false;
      animationId = requestAnimationFrame(step);
    }, 500);
  }

  wrapper.addEventListener('click', (e) => {
    if (e.target === wrapper || e.target === track) {
      resumeCarousel();
    }
  });
}
