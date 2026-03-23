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
  const saved = localStorage.getItem('commissionhub_theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const toggles = $$('.theme-toggle, #adm-theme-toggle');
  toggles.forEach(btn => {
    btn.innerHTML = theme === 'dark' 
      ? '<i class="fa-solid fa-sun"></i> <span>Light Mode</span>' 
      : '<i class="fa-solid fa-moon"></i> <span>Dark Mode</span>';
  });
  localStorage.setItem('commissionhub_theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
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
  const navItems = {
    'nav-requests':  { filter: 'all',       title: 'All Requests' },
    'nav-pending':   { filter: 'pending',   title: 'Pending Requests' },
    'nav-completed': { filter: 'completed', title: 'Completed Requests' },
  };

  Object.entries(navItems).forEach(([id, cfg]) => {
    $(`#${id}`)?.addEventListener('click', () => {
      $$('.sidebar-nav-item').forEach(el => el.classList.remove('active'));
      $(`#${id}`)?.classList.add('active');
      currentFilter = cfg.filter;
      const tt = $('#topbar-title');
      if (tt) tt.textContent = cfg.title;
      currentPage = 1;
      renderTable();
    });
  });

  /* --- Search & Filters --- */
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
              <div class="empty-icon">📋</div>
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
          // Scroll to top of table
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
    renderStats();
    renderTable();
    showToast(`Request marked as ${req.status}.`, 'success');
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

  const path = window.location.pathname;
  if (path.includes('admin')) {
    initAdminPage();
  } else {
    initClientPage();
  }
});
