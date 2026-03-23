/**
 * dashboard.js
 * Dedicated logic for the client dashboard
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Shared Utils (Assuming script.js is loaded before this)
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    /* --- Auth Check & Session Handling --- */
    function getSession() {
        try { return JSON.parse(sessionStorage.getItem('commissionhub_session')); }
        catch { return null; }
    }

    function clearSession() {
        sessionStorage.removeItem('commissionhub_session');
    }

    const session = getSession();
    if (!session) {
        // Redirection logic if not logged in
        // (Handled by script.js modal trigger usually, but here we can force redirect if needed)
    } else {
        // Set client name in greeting
        const greetingName = $('.greeting-title .gradient-text');
        if (greetingName) {
            greetingName.textContent = session.name || 'Client';
        }
    }

    // Setup Logout
    const btnLogout = $('#btn-logout');
    if (btnLogout) {
        btnLogout.style.display = 'inline-flex';
        btnLogout.addEventListener('click', () => {
            clearSession();
            window.location.href = 'index.html';
        });
    }

    const mobileLogout = $('#mobile-logout');
    if (mobileLogout) {
        mobileLogout.style.display = 'block';
        mobileLogout.addEventListener('click', (e) => {
            e.preventDefault();
            clearSession();
            window.location.href = 'index.html';
        });
    }

    /* --- Custom Smooth Scroll Animation --- */
    function animateScroll(element, target, duration = 600) {
        const start = element.scrollLeft;
        const change = target - start;
        let currentTime = 0;
        const increment = 16;

        // Disable snapping during animation to prevent "jumping" or "instant" snaps
        element.style.scrollSnapType = 'none';

        const easeInOutQuart = (t, b, c, d) => {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t * t * t + b;
            t -= 2;
            return -c / 2 * (t * t * t * t - 2) + b;
        };

        const animate = () => {
            currentTime += increment;
            const val = easeInOutQuart(currentTime, start, change, duration);
            element.scrollLeft = val;
            if (currentTime < duration) {
                requestAnimationFrame(animate);
            } else {
                element.scrollLeft = target;
                // Re-enable snapping after animation completes
                element.style.scrollSnapType = 'x mandatory';
            }
        };

        requestAnimationFrame(animate);
    }

    /* --- Free Swipe Carousel Logic --- */
    function initCarousels() {
        const containers = $$('.carousel-container');
        containers.forEach(container => {
            const wrapper = $('.carousel-wrapper', container);
            const nextBtn = $('.next-btn', container);
            const prevBtn = $('.prev-btn', container);
            
            if (!wrapper) return;

            const isCategory = container.classList.contains('category-carousel');
            let isAnimating = false;

            const handleScroll = (direction) => {
                if (isAnimating) return;
                isAnimating = true;

                const scrollAmount = isCategory ? (wrapper.clientWidth / 3) : wrapper.clientWidth;
                const target = wrapper.scrollLeft + (direction * scrollAmount);
                
                animateScroll(wrapper, target, 600);

                setTimeout(() => { isAnimating = false; }, 650);
            };

            nextBtn?.addEventListener('click', () => handleScroll(1));
            prevBtn?.addEventListener('click', () => handleScroll(-1));
        });
    }

    /* --- Lightbox Logic --- */
    function initLightbox() {
        const modal = $('#lightbox-modal');
        const img = $('#lightbox-img');
        const caption = $('#lightbox-caption');
        const closeBtn = $('.lightbox-close');

        if (!modal || !img) return;

        $$('.carousel-slide img').forEach(slideImg => {
            slideImg.style.cursor = 'zoom-in';
            slideImg.addEventListener('click', () => {
                const parentSlide = slideImg.closest('.carousel-slide');
                const title = parentSlide.querySelector('h3')?.textContent || '';
                
                img.src = slideImg.src;
                caption.textContent = title;
                modal.classList.add('open');
                document.body.style.overflow = 'hidden';
            });
        });

        const closeModal = () => {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        };

        closeBtn?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Close on ESC
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    }

    /* --- Pricing Modal Data & Logic --- */
    const CATEGORY_PRICING = {
        "Voice Acting": [
            { tier: "Basic", price: "₱1,500", features: ["Up to 100 words", "1 Revision", "High-Quality MP3", "48h Delivery"] },
            { tier: "Standard", price: "₱3,000", features: ["Up to 300 words", "3 Revisions", "WAV + MP3 Format", "24h Delivery", "Commercial Rights"] },
            { tier: "Premium", price: "₱6,000", features: ["Up to 1000 words", "Unlimited Revisions", "Raw Source Files", "Priority Delivery", "Full Broadcast Rights"] }
        ],
        "Photo & Video Editing": [
            { tier: "Basic", price: "₱1,250", features: ["Basic Cut & Trim", "Color Correction", "Up to 5 minutes", "1 Revision"] },
            { tier: "Standard", price: "₱3,750", features: ["Advanced Transitions", "Color Grading", "Text & Overlays", "Up to 15 minutes", "3 Revisions"] },
            { tier: "Premium", price: "₱7,500", features: ["Cinematic Editing", "Motion Graphics", "Sound Design", "Up to 30 minutes", "Unlimited Revisions"] }
        ],
        "Game Assets Designing": [
            { tier: "Basic", price: "₱1,750", features: ["1 Character Sprite", "Idle Animation", "16x16 / 32x32 size", "2 Revisions"] },
            { tier: "Standard", price: "₱4,000", features: ["Up to 3 Characters", "Full Animation Set", "Tileset (1 biome)", "Commercial Use"] },
            { tier: "Premium", price: "₱10,000", features: ["Full Game Asset Pack", "Custom UI Elements", "HD Assets (Vector/High-res)", "Ongoing Support"] }
        ],
        "Graphics Designing": [
            { tier: "Basic", price: "₱1,000", features: ["1 Initial Concept", "Flyer or Poster", "High-Res JPEG/PNG", "2 Revisions"] },
            { tier: "Standard", price: "₱2,500", features: ["2 Concepts", "Logo or Full Branding", "Source Files (PSD/AI)", "4 Revisions"] },
            { tier: "Premium", price: "₱5,000", features: ["4 Concepts", "Full Social Media Kit", "Brand Style Guide", "Unlimited Revisions"] }
        ],
        "Web Designing": [
            { tier: "Basic", price: "₱4,000", features: ["1 Landing Page Design", "Responsive Layout", "Figma File", "2 Revisions"] },
            { tier: "Standard", price: "₱12,500", features: ["Up to 5 Pages", "Prototyping & Flow", "Component Library", "5 Revisions"] },
            { tier: "Premium", price: "₱25,000", features: ["Full Website Design", "Advanced Interaction", "Design System", "Unlimited Revisions"] }
        ]
    };

    const pricingModal = $('#pricing-modal');
    const pricingClose = $('#pricing-modal-close');
    const pricingGrid = $('#pricing-grid');
    const pricingHeading = $('#pricing-modal-heading');

    function openPricingModal(category) {
        if (!pricingModal || !pricingGrid) return;

        pricingHeading.textContent = `${category} - Pricing`;
        pricingGrid.innerHTML = '';

        const plans = CATEGORY_PRICING[category] || CATEGORY_PRICING["Graphics Designing"];

        plans.forEach(plan => {
            const featuresHtml = plan.features.map(f => `<li><i class="fa-solid fa-check"></i> ${f}</li>`).join('');
            
            pricingGrid.innerHTML += `
                <div class="pricing-tier">
                    <h4>${plan.tier}</h4>
                    <div class="pricing-price">${plan.price}</div>
                    <ul class="pricing-features">
                        ${featuresHtml}
                    </ul>
                </div>
            `;
        });

        pricingModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closePricingModal() {
        if (!pricingModal) return;
        pricingModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    $$('.btn-pricing').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = btn.getAttribute('data-category');
            openPricingModal(category);
        });
    });

    if (pricingClose) {
        pricingClose.addEventListener('click', closePricingModal);
    }
    if (pricingModal) {
        pricingModal.addEventListener('click', (e) => {
            if (e.target === pricingModal) closePricingModal();
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePricingModal();
    });

    initCarousels();
    initLightbox();
});
