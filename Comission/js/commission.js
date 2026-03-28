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

/* =========================================
   FILE UPLOAD LOGIC
   ========================================= */
document.addEventListener('DOMContentLoaded', function() {
  const dropArea = document.getElementById('drop-area');
  const fileInput = document.getElementById('fileUpload');
  const previewArea = document.getElementById('previewArea');
  
  if (!dropArea || !fileInput || !previewArea) return;

  // Max file size in bytes (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  
  // Allowed file types
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/mp4'];
  
  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });
  
  // Highlight drop area when item is dragged over it
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });
  
  // Handle dropped files
  dropArea.addEventListener('drop', handleDrop, false);
  
  // Handle files from input field
  fileInput.addEventListener('change', function() {
    handleFiles(this.files);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  function highlight() {
    dropArea.classList.add('active');
  }
  
  function unhighlight() {
    dropArea.classList.remove('active');
  }
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    handleFiles(files);
  }
  
  function handleFiles(files) {
    const filesArray = Array.from(files);
    
    if (filesArray.length === 0) return;
    
    // Process each file
    filesArray.forEach(file => {
      // Validate file type and size
      if (!validateFile(file)) return;
      
      // Create preview item
      const uploadItem = createUploadItem(file);
      previewArea.appendChild(uploadItem);
      
      // Simulate upload
      simulateUpload(uploadItem, file);
    });
    
    // Clear the input field to allow selecting the same file again
    fileInput.value = '';
  }
  
  function validateFile(file) {
    // Check file type (allowing all listed formats and fonts conceptually if needed)
    // The snippet allows some types, for 'Fonts' the user specifically asked for it in the UI
    const isFont = file.name.match(/\.(ttf|otf|woff|woff2)$/i);
    
    if (!ALLOWED_TYPES.includes(file.type) && !isFont && !file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert(`File type not allowed: ${file.name}`);
      return false;
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      alert(`File too large: ${file.name} (${formatFileSize(file.size)})`);
      return false;
    }
    
    return true;
  }
  
  function createUploadItem(file) {
    const item = document.createElement('div');
    item.className = 'upload-item';
    
    const iconClass = getFileIconClass(file.type || file.name);
    
    item.innerHTML = `
      <div class="upload-item-icon">
        <i class="${iconClass}"></i>
      </div>
      <div class="upload-item-details">
        <div class="upload-item-name">${file.name}</div>
        <div class="upload-item-size">${formatFileSize(file.size)}</div>
        <div class="upload-item-progress-container">
          <div class="upload-item-progress" style="width: 0%"></div>
        </div>
      </div>
      <div class="upload-item-actions">
        <div class="upload-item-status">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <button class="upload-item-remove" type="button" aria-label="Remove uploaded file">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    // Add event listener to remove button
    item.querySelector('.upload-item-remove').addEventListener('click', function() {
      item.remove();
    });
    
    return item;
  }
  
  function simulateUpload(item, file) {
    const progressBar = item.querySelector('.upload-item-progress');
    const statusIcon = item.querySelector('.upload-item-status i');
    let progress = 0;
    
    // Simulate upload progress
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Update status icon
        statusIcon.className = 'fas fa-check';
        statusIcon.style.color = 'var(--upload-item-icon)';
      }
      
      progressBar.style.width = `${progress}%`;
    }, 200);
  }
  
  function getFileIconClass(fileType) {
    if (fileType.includes('image/')) {
      return 'fas fa-image';
    } else if (fileType === 'application/pdf') {
      return 'fas fa-file-pdf';
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return 'fas fa-file-word';
    } else if (fileType.includes('video/')) {
      return 'fas fa-file-video';
    } else if (fileType.includes('.ttf') || fileType.includes('.otf') || fileType.includes('.woff')) {
      return 'fas fa-font';
    } else {
      return 'fas fa-file';
    }
  }
  
  function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  }
});
