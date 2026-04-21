'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));


  async function getSession() {
    const res = await API.getSession();
    return res.success ? res.user : null;
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

  // Check session and pre-fill form
  (async () => {
    const session = await getSession();
    if (session) {
      if ($('#req-name')) $('#req-name').value = session.name || '';
      if ($('#req-email')) $('#req-email').value = session.email || '';
    }
  })();

  const CATEGORY_PRICING = {
      "Voice Acting": [
          { tier: "Silver Tier", price: "₱1,500" },
          { tier: "Gold Tier", price: "₱3,000" },
          { tier: "Diamond Tier", price: "₱6,000" }
      ],
      "Photo & Video Editing": [
          { tier: "Silver Tier", price: "₱1,250" },
          { tier: "Gold Tier", price: "₱3,750" },
          { tier: "Diamond Tier", price: "₱7,500" }
      ],
      "Game Assets Designing": [
          { tier: "Silver Tier", price: "₱1,750" },
          { tier: "Gold Tier", price: "₱4,000" },
          { tier: "Diamond Tier", price: "₱10,000" }
      ],
      "Graphics Designing": [
          { tier: "Silver Tier", price: "₱1,000" },
          { tier: "Gold Tier", price: "₱2,500" },
          { tier: "Diamond Tier", price: "₱5,000" }
      ],
      "Web Designing": [
          { tier: "Silver Tier", price: "₱4,000" },
          { tier: "Gold Tier", price: "₱12,500" },
          { tier: "Diamond Tier", price: "₱25,000" }
      ],
      "Other": [
          { tier: "Custom Budget", price: "To be discussed" }
      ]
  };

  const reqService = $('#req-service');
  const reqPayment = $('#req-payment');
  const reqBudget = $('#req-budget');
  const fgPayment = $('#fg-payment');
  const fgBudget = $('#fg-budget');

  if (reqService && fgPayment) {
    reqService.addEventListener('change', (e) => {
      if (e.target.value) {
        fgPayment.style.display = 'flex';
        const category = e.target.value;
        const tiers = CATEGORY_PRICING[category] || CATEGORY_PRICING["Other"];
        if (reqBudget) {
            reqBudget.innerHTML = '<option value="">— Select a tier —</option>';
            tiers.forEach(t => {
                const opt = document.createElement('option');
                opt.value = `${t.tier} (${t.price})`;
                opt.textContent = `${t.tier} (${t.price})`;
                reqBudget.appendChild(opt);
            });
        }
      } else {
        fgPayment.style.display = 'none';
        if (reqPayment) reqPayment.value = '';
        if (fgBudget) fgBudget.style.display = 'none';
        if (reqBudget) reqBudget.value = '';
      }
    });
  }

  if (reqPayment && fgBudget) {
    reqPayment.addEventListener('change', (e) => {
      if (e.target.value) {
        fgBudget.style.display = 'flex';
      } else {
        fgBudget.style.display = 'none';
        if (reqBudget) reqBudget.value = '';
      }
    });
  }

  const commissionForm = $('#commission-form');
  if (commissionForm) {
    commissionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const session = await getSession();
      if (!session) {
        if (typeof showToast === 'function') {
          showToast('Please sign in to submit a request.', 'error');
        } else {
          alert('Please sign in to submit a request.');
        }
        return;
      }

      const name    = $('#req-name')?.value.trim();
      const email   = $('#req-email')?.value.trim();
      const service = $('#req-service')?.value;
      const payment = $('#req-payment')?.value;
      const budget  = $('#req-budget')?.value;
      const deadline = $('#req-deadline')?.value;
      const details = $('#req-details')?.value.trim();
      
      let valid = true;

      if (!name)              { setError('fg-name', true); valid = false; } else setError('fg-name', false);
      if (!validateEmail(email)) { setError('fg-email', true); valid = false; } else setError('fg-email', false);
      if (!service)           { setError('fg-service', true); valid = false; } else setError('fg-service', false);
      if (!payment)           { setError('fg-payment', true); valid = false; } else setError('fg-payment', false);
      if (!budget)            { setError('fg-budget', true); valid = false; } else setError('fg-budget', false);
      
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

      // Extract amount from budget string like "Silver Tier (₱1,500)"
      let amount = 0;
      const amountMatch = budget.match(/₱([\d,]+)/);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      }

      const requestData = {
        id: uid(),
        name, email, service, payment, budget, amount, deadline, details
      };

      const res = await API.createCommission(requestData);

      if (res.success) {
        commissionForm.reset();
        if (typeof showToast === 'function') {
          showToast('Commission request submitted! 🎉 I\'ll be in touch shortly.', 'success', 5000);
        } else {
          alert('Commission request submitted! 🎉');
        }
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 2000);
      } else {
        if (typeof showToast === 'function') {
          showToast(res.message || 'Submission failed.', 'error');
        } else {
          alert(res.message || 'Submission failed.');
        }
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const dropArea = document.getElementById('drop-area');
  const fileInput = document.getElementById('fileUpload');
  const previewArea = document.getElementById('previewArea');
  
  if (!dropArea || !fileInput || !previewArea) return;

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/mp4'];
  
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });
  
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });
  
  dropArea.addEventListener('drop', handleDrop, false);
  
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
    
    filesArray.forEach(file => {
      if (!validateFile(file)) return;
      
      const uploadItem = createUploadItem(file);
      previewArea.appendChild(uploadItem);
      
      simulateUpload(uploadItem, file);
    });
    
    fileInput.value = '';
  }
  
  function validateFile(file) {
    const isFont = file.name.match(/\.(ttf|otf|woff|woff2)$/i);
    
    if (!ALLOWED_TYPES.includes(file.type) && !isFont && !file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert(`File type not allowed: ${file.name}`);
      return false;
    }
    
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
    
    item.querySelector('.upload-item-remove').addEventListener('click', function() {
      item.remove();
    });
    
    return item;
  }
  
  function simulateUpload(item, file) {
    const progressBar = item.querySelector('.upload-item-progress');
    const statusIcon = item.querySelector('.upload-item-status i');
    let progress = 0;
    
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
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
