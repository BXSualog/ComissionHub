'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const $ = (selector) => document.querySelector(selector);

  const CATEGORY_PRICING = {
    'Voice Acting': [
      { tier: 'Silver Tier', price: '₱1,500' },
      { tier: 'Gold Tier',   price: '₱3,000' },
      { tier: 'Diamond Tier', price: '₱6,000' }
    ],
    'Photo & Video Editing': [
      { tier: 'Silver Tier', price: '₱1,250' },
      { tier: 'Gold Tier',   price: '₱3,750' },
      { tier: 'Diamond Tier', price: '₱7,500' }
    ],
    'Game Assets Designing': [
      { tier: 'Silver Tier', price: '₱1,750' },
      { tier: 'Gold Tier',   price: '₱4,000' },
      { tier: 'Diamond Tier', price: '₱10,000' }
    ],
    'Graphics Designing': [
      { tier: 'Silver Tier', price: '₱1,000' },
      { tier: 'Gold Tier',   price: '₱2,500' },
      { tier: 'Diamond Tier', price: '₱5,000' }
    ],
    'Web Designing': [
      { tier: 'Silver Tier', price: '₱4,000' },
      { tier: 'Gold Tier',   price: '₱12,500' },
      { tier: 'Diamond Tier', price: '₱25,000' }
    ],
    'Other': [
      { tier: 'Custom Budget', price: 'To be discussed' }
    ]
  };

  function generateUID() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function showFieldError(groupId, show) {
    const group = $(`#${groupId}`);
    if (!group) return;
    group.classList.toggle('has-error', show);
  }

  async function getCurrentUser() {
    const response = await API.getSession();
    return response.success ? response.user : null;
  }

  (async () => {
    const user = await getCurrentUser();
    if (user) {
      const nameInput = $('#req-name');
      const emailInput = $('#req-email');
      
      if (nameInput) {
        nameInput.value = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        nameInput.readOnly = true;
        nameInput.classList.add('readonly-field'); // Optional: for styling
      }
      if (emailInput) {
        emailInput.value = user.email || '';
      }
    }
  })();

  const serviceDropdown = $('#req-service');
  const paymentDropdown = $('#req-payment');
  const budgetDropdown  = $('#req-budget');
  const paymentGroup    = $('#fg-payment');
  const budgetGroup     = $('#fg-budget');

  if (serviceDropdown && paymentGroup) {
    serviceDropdown.addEventListener('change', (event) => {
      const selectedService = event.target.value;

      if (selectedService) {
        paymentGroup.style.display = 'flex';

        const tiers = CATEGORY_PRICING[selectedService] || CATEGORY_PRICING['Other'];

        if (budgetDropdown) {
          budgetDropdown.innerHTML = '<option value="">— Select a tier —</option>';

          tiers.forEach(tierOption => {
            const option = document.createElement('option');
            option.value       = `${tierOption.tier} (${tierOption.price})`;
            option.textContent = `${tierOption.tier} (${tierOption.price})`;
            budgetDropdown.appendChild(option);
          });
        }
      } else {
        paymentGroup.style.display = 'none';
        if (paymentDropdown) paymentDropdown.value = '';
        if (budgetGroup)     budgetGroup.style.display = 'none';
        if (budgetDropdown)  budgetDropdown.value = '';
      }
    });
  }

  if (paymentDropdown && budgetGroup) {
    paymentDropdown.addEventListener('change', (event) => {
      if (event.target.value) {
        budgetGroup.style.display = 'flex';
      } else {
        budgetGroup.style.display = 'none';
        if (budgetDropdown) budgetDropdown.value = '';
      }
    });
  }

  const commissionForm = $('#commission-form');

  if (commissionForm) {
    commissionForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const user = await getCurrentUser();
      if (!user) {
        if (typeof showToast === 'function') {
          showToast('Please sign in to submit a request.', 'error');
        } else {
          alert('Please sign in to submit a request.');
        }
        return;
      }

      const name     = $('#req-name')?.value.trim();
      const email    = $('#req-email')?.value.trim();
      const service  = $('#req-service')?.value;
      const payment  = $('#req-payment')?.value;
      const budget   = $('#req-budget')?.value;
      const deadline = $('#req-deadline')?.value;
      const details  = $('#req-details')?.value.trim();

      let isFormValid = true;

      if (!name) {
        showFieldError('fg-name', true);
        isFormValid = false;
      } else {
        showFieldError('fg-name', false);
      }

      if (!isValidEmail(email)) {
        showFieldError('fg-email', true);
        isFormValid = false;
      } else {
        showFieldError('fg-email', false);
      }

      if (!service) {
        showFieldError('fg-service', true);
        isFormValid = false;
      } else {
        showFieldError('fg-service', false);
      }

      if (!payment) {
        showFieldError('fg-payment', true);
        isFormValid = false;
      } else {
        showFieldError('fg-payment', false);
      }

      if (!budget) {
        showFieldError('fg-budget', true);
        isFormValid = false;
      } else {
        showFieldError('fg-budget', false);
      }

      if (deadline && isNaN(new Date(deadline).getTime())) {
        showFieldError('fg-deadline', true);
        isFormValid = false;
      } else {
        showFieldError('fg-deadline', false);
      }

      if (!details || details.length < 20) {
        showFieldError('fg-details', true);
        isFormValid = false;
      } else {
        showFieldError('fg-details', false);
      }

      if (!isFormValid) {
        if (typeof showToast === 'function') {
          showToast('Please fill all required fields correctly.', 'error');
        } else {
          alert('Please fill all required fields correctly.');
        }
        return;
      }

      let numericAmount = 0;
      const priceMatch = budget.match(/₱([\d,]+)/);
      if (priceMatch) {
        numericAmount = parseFloat(priceMatch[1].replace(/,/g, ''));
      }

      const requestData = {
        id: generateUID(),
        name,
        email,
        service,
        payment,
        budget,
        amount:   numericAmount,
        deadline,
        details
      };

      const response = await API.createCommission(requestData);

      if (response.success) {
        commissionForm.reset();

        if (typeof showToast === 'function') {
          showToast("Commission request submitted! 🎉 I'll be in touch shortly.", 'success', 5000);
        } else {
          alert('Commission request submitted! 🎉');
        }

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 2000);
      } else {
        if (typeof showToast === 'function') {
          showToast(response.message || 'Submission failed.', 'error');
        } else {
          alert(response.message || 'Submission failed.');
        }
      }
    });
  }

});
