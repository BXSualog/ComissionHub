/* =========================================
   COMMISSIONHUB – COMMISSION PAGE SCRIPT
   ========================================= */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Common utilities (assuming they are in script.js and exposed or we redefine what we need)
  // For safety in this demo, let's redefine or ensure they exist.
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const STORAGE_KEY = 'commissionhub_requests';
  const SESSION_KEY = 'commissionhub_session';

  function getRequests() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveRequests(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function setError(groupId, show) {
    const group = $(`#${groupId}`);
    if (!group) return;
    group.classList.toggle('has-error', show);
  }

  // Pre-fill form if logged in
  const session = getSession();
  if (session) {
    if ($('#req-name')) $('#req-name').value = session.name || '';
    if ($('#req-email')) $('#req-email').value = session.email || '';
  }

  /* --- Commission Form Handling --- */
  const commissionForm = $('#commission-form');
  if (commissionForm) {
    commissionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name    = $('#req-name')?.value.trim();
      const email   = $('#req-email')?.value.trim();
      const service = $('#req-service')?.value;
      const budget  = $('#req-budget')?.value;
      const deadline = $('#req-deadline')?.value;
      const details = $('#req-details')?.value.trim();
      
      let valid = true;

      if (!name)              { setError('fg-name', true); valid = false; } else setError('fg-name', false);
      if (!validateEmail(email)) { setError('fg-email', true); valid = false; } else setError('fg-email', false);
      if (!service)           { setError('fg-service', true); valid = false; } else setError('fg-service', false);
      if (!budget)            { setError('fg-budget', true); valid = false; } else setError('fg-budget', false);
      
      // Optional fields can be empty, but date should be valid if provided
      if (deadline && isNaN(new Date(deadline).getTime())) {
        setError('fg-deadline', true); valid = false;
      } else {
        setError('fg-deadline', false);
      }
      
      if (!details || details.length < 20) { setError('fg-details', true); valid = false; } else setError('fg-details', false);

      if (!valid) {
        if (typeof showToast === 'function') {
           showToast('Please fill all required fields correctly.', 'error');
        } else {
           alert('Please fill all required fields correctly.');
        }
        return;
      }

      const request = {
        id: uid(),
        name, email, service, budget, deadline, details,
        status: 'pending',
        date: new Date().toISOString(),
      };

      const requests = getRequests();
      requests.unshift(request);
      saveRequests(requests);

      commissionForm.reset();
      
      if (typeof showToast === 'function') {
        showToast('Commission request submitted! 🎉 I\'ll be in touch shortly.', 'success', 5000);
      } else {
        alert('Commission request submitted! 🎉');
      }

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
    });
  }
});
