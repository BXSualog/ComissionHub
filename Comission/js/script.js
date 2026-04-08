/* =========================================
   COMMISSIONHUB – MASTER SCRIPT
   Handles: Client side + Admin Dashboard
   ========================================= */

'use strict';

/* ===========================
   CONSTANTS & CONFIG
   =========================== */
const STORAGE_KEY = 'commissionhub_requests';
const USERS_KEY   = 'commissionhub_users';
const SESSION_KEY = 'commissionhub_session';
const ADMIN_CREDS = { user: 'admin', pass: 'admin123' };

/* ===========================
   UTILS
   =========================== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ===========================
   LOCAL STORAGE HELPERS
   =========================== */
function getRequests() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveRequests(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch { return []; }
}

function saveUsers(list) {
  localStorage.setItem(USERS_KEY, JSON.stringify(list));
}

function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

function setSession(data) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

/* ===========================
   THEME SYSTEM
   =========================== */
function getTheme() {
  return 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', 'dark');
  localStorage.setItem('commissionhub_theme', 'dark');
}

function toggleTheme() {
  // Theme toggling is disabled.
}

/* ===========================
   TOAST NOTIFICATIONS
   =========================== */
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

/* ===========================
   LOADING SCREEN
   =========================== */
function hideLoadingScreen() {
  const screen = $('#loading-screen');
  if (!screen) return;
  setTimeout(() => {
    screen.classList.add('hidden');
    screen.addEventListener('transitionend', () => screen.remove(), { once: true });
  }, 900);
}

/* ===========================
   FORM VALIDATION HELPERS
   =========================== */
function setError(groupId, show) {
  const group = $(`#${groupId}`);
  if (!group) return;
  group.classList.toggle('has-error', show);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/* ===========================
   SCROLL ANIMATIONS
   =========================== */
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

/* ===================================================
   CLIENT SIDE (index.html logic)
   =================================================== */
function initClientPage() {
  /* --- Nav scroll effect --- */
  const navbar = $('#navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    });
  }

  /* --- Hamburger mobile menu --- */
  const hamburger = $('#nav-hamburger');
  const mobileMenu = $('#mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('active', open);
      hamburger.setAttribute('aria-expanded', open);
    });
    // Close on nav link click
    $$('#mobile-menu a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });
  }

  /* --- Theme toggle --- */
  const themeBtn = $('#theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  const sidebarThemeBtn = $('#sidebar-theme-toggle');
  if (sidebarThemeBtn) sidebarThemeBtn.addEventListener('click', toggleTheme);

  /* --- Auth Modal --- */
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

  /* --- Dashboard Button Auth Check --- */
  $('#btn-go-dashboard')?.addEventListener('click', (e) => {
    e.preventDefault();
    const session = getSession();
    if (!session) {
      openModal('login');
      showToast('Please sign in to access your dashboard.', 'info');
    } else {
      window.location.href = 'dashboard.html';
    }
  });

  /* --- Login Submit --- */
  $('#btn-do-login')?.addEventListener('click', () => {
    const email = $('#login-email')?.value.trim();
    const pw    = $('#login-password')?.value;
    let valid = true;

    if (!validateEmail(email)) { setError('fg-login-email', true); valid = false; }
    else setError('fg-login-email', false);

    if (!pw) { setError('fg-login-pw', true); valid = false; }
    else setError('fg-login-pw', false);

    if (!valid) return;

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === pw);
    if (!user) {
      setError('fg-login-email', true);
      const err = $('#fg-login-email .form-error');
      if (err) err.textContent = 'Invalid email or password.';
      return;
    }

    setSession({ email, name: user.name });
    closeModal();
    showToast(`Welcome back, ${user.name}! 👋`, 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  });

  /* --- Signup Submit --- */
  $('#btn-do-signup')?.addEventListener('click', () => {
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

    const users = getUsers();
    if (users.find(u => u.email === email)) {
      setError('fg-su-email', true);
      const err = $('#fg-su-email .form-error');
      if (err) err.textContent = 'Email already registered.';
      return;
    }

    users.push({ name, email, password: pw, created: new Date().toISOString() });
    saveUsers(users);
    setSession({ email, name });
    closeModal();
    showToast(`Account created! Welcome, ${name} 🎉`, 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  });

  /* --- Google Buttons (simulated) --- */
  $('#btn-google-login')?.addEventListener('click', () => {
    showToast('Google Sign-In is not connected in demo mode.', 'info');
  });
  $('#btn-google-signup')?.addEventListener('click', () => {
    showToast('Google Sign-Up is not connected in demo mode.', 'info');
  });

  /* --- Commission Form Logic Moved to commission.js --- */

}

/* ===================================================
   ADMIN SIDE (admin.html logic)
   =================================================== */
function initAdminPage() {
  const loginView     = $('#admin-login-view');
  const dashboardView = $('#admin-dashboard-view');

  if (!loginView || !dashboardView) return;

  /* --- Theme toggle --- */
  $('#adm-theme-toggle')?.addEventListener('click', toggleTheme);

  /* --- Sidebar toggle (mobile) --- */
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

  /* ---- State ---- */
  let currentFilter = 'all'; // 'all' | 'pending' | 'completed'
  let searchQuery   = '';
  let serviceFilter = 'all';
  let currentPage   = 1;
  const itemsPerPage = 10;

  function showDashboard() {
    loginView.style.display = 'none';
    dashboardView.style.display = 'block';
    renderStats();
    currentPage = 1;
    renderTable();
  }

  function showLogin() {
    loginView.style.display = 'block';
    dashboardView.style.display = 'none';
  }

  /* --- Admin Login --- */
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
      localStorage.setItem('commissionhub_admin', '1');
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

  /* --- Auto-login if already authenticated --- */
  if (localStorage.getItem('commissionhub_admin') === '1') {
    showDashboard();
  } else {
    showLogin();
  }

  /* --- Logout --- */
  $('#adm-logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('commissionhub_admin');
    showLogin();
    showToast('Signed out successfully.', 'info');
  });



  /* --- Sidebar Navigation --- */
  $('#nav-requests')?.addEventListener('click', () => {
    $$('.sidebar-nav-item').forEach(el => el.classList.remove('active'));
    $('#nav-requests')?.classList.add('active');
    
    $('#requests-panel').style.display = 'block';
    $('#wallet-panel').style.display = 'none';
    $('#admin-stats-row').style.display = 'grid';
    $('#topbar-title').textContent = 'All Requests';

    currentFilter = 'all';
    serviceFilter = 'all';
    searchQuery = '';
    
    // Reset dropdowns
    if ($('#service-filter')) $('#service-filter').value = 'all';
    if ($('#status-filter')) $('#status-filter').value = 'all';
    if ($('#search-input')) $('#search-input').value = '';

    currentPage = 1;
    renderTable();
  });

  $('#nav-wallet')?.addEventListener('click', () => {
    $$('.sidebar-nav-item').forEach(el => el.classList.remove('active'));
    $('#nav-wallet')?.classList.add('active');

    $('#requests-panel').style.display = 'none';
    $('#wallet-panel').style.display = 'block';
    $('#admin-stats-row').style.display = 'none';
    $('#topbar-title').textContent = 'E-Wallet';

    renderWalletContent();
  });

  /* --- Search & Filters --- */
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

  /* --- Clear All --- */
  $('#btn-clear-all')?.addEventListener('click', () => {
    openConfirm('Delete ALL commission requests? This cannot be undone.', () => {
      saveRequests([]);
      renderStats();
      currentPage = 1;
      renderTable();
      showToast('All requests cleared.', 'warning');
    });
  });

  /* --- Confirm Modal --- */
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

  /* ===========================
     RENDER STATS
     =========================== */
  function renderStats() {
    const all       = getRequests();
    const pending   = all.filter(r => r.status === 'pending').length;
    const completed = all.filter(r => r.status === 'completed').length;
    const rate      = all.length > 0 ? Math.round((completed / all.length) * 100) + '%' : '—';

    const statTotal     = $('#stat-total');
    const statPending   = $('#stat-pending');
    const statCompleted = $('#stat-completed');
    const statRate      = $('#stat-rate');

    if (statTotal)     statTotal.textContent     = all.length;
    if (statPending)   statPending.textContent   = pending;
    if (statCompleted) statCompleted.textContent = completed;
    if (statRate)      statRate.textContent      = rate;
  }

  /* ===========================
     RENDER TABLE
     =========================== */
  function renderTable() {
    const tbody = $('#requests-tbody');
    if (!tbody) return;

    let requests = getRequests();

    // Status filter
    if (currentFilter !== 'all') {
      requests = requests.filter(r => r.status === currentFilter);
    }

    // Service filter
    if (serviceFilter !== 'all') {
      requests = requests.filter(r => r.service === serviceFilter);
    }

    // Search filter
    if (searchQuery) {
      requests = requests.filter(r =>
        r.name.toLowerCase().includes(searchQuery)  ||
        r.email.toLowerCase().includes(searchQuery) ||
        r.service.toLowerCase().includes(searchQuery)
      );
    }

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

    // Slice for pagination
    const start = (currentPage - 1) * itemsPerPage;
    const end   = start + itemsPerPage;
    const paginatedItems = requests.slice(start, end);

    tbody.innerHTML = paginatedItems.map(r => `
      <tr data-id="${escapeHtml(r.id)}">
        <td data-label="Client" class="td-clickable td-client-cell" data-id="${escapeHtml(r.id)}">
          <div class="td-name">${escapeHtml(r.name)}</div>
          <div class="td-email">${escapeHtml(r.email)}</div>
        </td>
        <td data-label="Status">
          <span class="badge badge-${r.status === 'completed' ? 'completed' : 'pending'}">
            ${r.status === 'completed' ? '✅ Completed' : '🕐 Pending'}
          </span>
        </td>
        <td data-label="Actions">
          <div class="td-actions">
            <button class="btn btn-sm ${r.status === 'completed' ? 'btn-secondary' : 'btn-success'} btn-toggle-status"
              data-id="${escapeHtml(r.id)}"
              title="${r.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}">
              ${r.status === 'completed' ? '↩' : '✓'}
            </button>
            <button class="btn btn-sm btn-danger btn-delete-request"
              data-id="${escapeHtml(r.id)}"
              title="Delete Request">
              🗑
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    renderPagination(totalItems);

    /* Bind row actions */
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



  /* --- Pagination Logic --- */
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

    // Simple pagination logic
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

    // Bind clicks
    $$('.pagination-btn', container).forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (!isNaN(page) && page !== currentPage) {
          currentPage = page;
          renderTable();
          
          // Scroll to top of content
          $('.admin-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* --- Details Modal --- */
  const detailsModal = $('#details-modal');

  function openDetails(id) {
    const requests = getRequests();
    const req = requests.find(r => r.id === id);
    if (!req) return;

    $('#det-date').textContent     = formatDate(req.date);
    $('#det-deadline').textContent = formatDate(req.deadline);
    $('#det-budget').textContent   = req.budget;
    $('#det-service').textContent  = req.service;
    $('#det-details').textContent  = req.details;

    detailsModal?.classList.add('open');
  }

  function closeDetails() {
    detailsModal?.classList.remove('open');
  }

  $('#details-modal-close')?.addEventListener('click', closeDetails);
  $('#details-close-btn')?.addEventListener('click', closeDetails);
  detailsModal?.addEventListener('click', e => { if (e.target === detailsModal) closeDetails(); });

  /* --- Toggle Status --- */
  function toggleStatus(id) {
    const requests = getRequests();
    const req = requests.find(r => r.id === id);
    if (!req) return;
    
    req.status = req.status === 'completed' ? 'pending' : 'completed';
    saveRequests(requests);
    
    if (req.status === 'completed') {
      const notifs = JSON.parse(localStorage.getItem('commissionhub_notifications') || '[]');
      notifs.unshift({
        id: uid(),
        reqId: req.id,
        message: `Your commission request for "${req.service}" has been accepted!`,
        date: new Date().toISOString(),
        read: false
      });
      localStorage.setItem('commissionhub_notifications', JSON.stringify(notifs));
    }

    renderStats();
    renderTable();
    
    // Also update wallet if currently visible
    if ($('#nav-wallet')?.classList.contains('active')) {
      renderWalletContent();
    }

    showToast(`Request marked as ${req.status}.`, 'success');
  }

  /* ===========================
     E-WALLET LOGIC
     =========================== */
  function parseBudget(str) {
    if (!str) return 0;
    // Extract number from strings like "Silver Tier (₱1,000)" or "₱15,000"
    // Handle both Philippine Peso and Dollar signs just in case
    const match = str.match(/[₱$](\d{1,3}(,\d{3})*)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, '')) || 0;
    }
    // Fallback for simple numbers
    const numOnly = str.match(/\d+/);
    return numOnly ? parseInt(numOnly[0]) : 0;
  }

  function renderWalletContent() {
    const tbody = $('#wallet-history-tbody');
    const totalEl = $('#wallet-total-balance');
    const countEl = $('#wallet-completed-count');
    if (!tbody || !totalEl || !countEl) return;

    const all = getRequests();
    const completed = all.filter(r => r.status === 'completed');
    
    let totalIncome = 0;
    
    completed.forEach(r => {
      totalIncome += parseBudget(r.budget);
    });

    totalEl.textContent = `₱${totalIncome.toLocaleString()}`;
    countEl.textContent = completed.length;

    if (completed.length === 0) {
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

    // Sort by date (newest first)
    completed.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = completed.map(r => `
      <tr>
        <td data-label="Client">
          <div class="td-name">${escapeHtml(r.name)}</div>
          <div class="td-email">${escapeHtml(r.email)}</div>
        </td>
        <td data-label="Service">${escapeHtml(r.service)}</td>
        <td data-label="Amount" class="td-amount">₱${parseBudget(r.budget).toLocaleString()}</td>
        <td data-label="Date">${formatDate(r.date)}</td>
      </tr>
    `).join('');
  }

  /* --- Delete Request --- */
  function deleteRequest(id) {
    let requests = getRequests();
    requests = requests.filter(r => r.id !== id);
    saveRequests(requests);
    renderStats();
    // Adjust page if current page becomes empty
    const totalPages = Math.ceil(requests.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    renderTable();
    showToast('Request deleted.', 'warning');
  }
}

/* ===========================
   ROUTE DETECTION & INIT
   =========================== */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getTheme());
  hideLoadingScreen();
  initScrollAnimations();

  /* --- Password Visibility Toggle --- */
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

  /* --- Sidebar Modals (Recent Requests & Notifications) --- */
  function initSidebarModals() {
    const rrModal = $('#recent-requests-modal');
    const rrOpenBtn = $('#btn-recent-requests');
    const rrCloseBtn = $('#rr-modal-close');

    const notifModal = $('#notifications-modal');
    const notifOpenBtn = $('#btn-notifications');
    const notifCloseBtn = $('#notif-modal-close');

    if (!rrModal && !notifModal) return;

    function populateNotifications() {
      const notifs = JSON.parse(localStorage.getItem('commissionhub_notifications') || '[]');
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
              <div class="notification-item" style="padding: 1rem; border-radius: var(--radius-md); background: rgba(255,255,255,0.05); border-left: 3px solid ${n.read ? 'transparent' : 'var(--accent)'}; transition: transform 0.2s ease;">
                <p style="margin-bottom:0.5rem; color: #fff; font-size: 0.95rem;">${escapeHtml(n.message)}</p>
                <small style="color:var(--text-muted); font-size: 0.8rem;">${formatDate(n.date)}</small>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-sm btn-secondary" id="clear-notifs-btn" style="margin-top: 1.5rem; width: 100%;">Clear Notifications</button>
        `;
        
        const clearBtn = document.getElementById('clear-notifs-btn');
        if (clearBtn) clearBtn.addEventListener('click', () => {
          localStorage.removeItem('commissionhub_notifications');
          populateNotifications();
          updateNotificationBadge();
        });
      }
    }

    function updateNotificationBadge() {
      const notifs = JSON.parse(localStorage.getItem('commissionhub_notifications') || '[]');
      const unreadCount = notifs.filter(n => !n.read).length;
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

    const openM = (modal) => {
      if (!modal) return;
      if (modal === notifModal) {
         populateNotifications();
         // Mark all as read
         const notifs = JSON.parse(localStorage.getItem('commissionhub_notifications') || '[]');
         notifs.forEach(n => n.read = true);
         localStorage.setItem('commissionhub_notifications', JSON.stringify(notifs));
         updateNotificationBadge();
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

  const path = window.location.pathname;
  if (path.includes('admin')) {
    initAdminPage();
  } else {
    initClientPage();
    initSidebarModals();
    initServicesCarousel(); // Initialize the new carousel
    
    // Sidebar Logout
    $('#btn-sidebar-logout')?.addEventListener('click', () => {
      clearSession();
      window.location.href = 'index.html';
    });
  }
});

/* ===========================
   SERVICES CAROUSEL LOGIC
   =========================== */
function initServicesCarousel() {
  const track = $('#services-track');
  const wrapper = $('.services-carousel-wrapper');
  if (!track || !wrapper) return;

  const originalCards = Array.from(track.children);
  if (originalCards.length === 0) return;

  // 1. Prepare original cards and ensure they are visible
  originalCards.forEach(card => {
    card.classList.remove('animate-on-scroll', 'visible');
    card.style.opacity = '1';
    card.style.transform = 'none';
  });

  // 2. Triple the cards for smooth infinite look
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
  const speed = 0.8; // Pixels per frame

  // Calculate width of exactly one set of cards (including gaps)
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

  // Start the engine after a small delay to ensure layout
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

    // Calculate current offset to snap perfectly from current position
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

    // Wait for transition to finish before restarting loop
    setTimeout(() => {
      track.style.transition = 'none';
      isPaused = false;
      animationId = requestAnimationFrame(step);
    }, 500);
  }

  // Resume on background click
  wrapper.addEventListener('click', (e) => {
    if (e.target === wrapper || e.target === track) {
      resumeCarousel();
    }
  });
}
