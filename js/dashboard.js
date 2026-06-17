'use strict';

document.addEventListener('DOMContentLoaded', async () => {

    const $ = (selector, context = document) => context.querySelector(selector);
    const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

    const sessionResponse = await API.getSession();
    const currentUser = sessionResponse.success ? sessionResponse.user : null;

    if (currentUser) {
        const greetingNameElement = $('.greeting-title .gradient-text');
        if (greetingNameElement) {
            greetingNameElement.textContent = currentUser.firstName || currentUser.first_name || 'Client';
        }
    }

    function animateScroll(element, targetPosition, duration = 600) {
        const startPosition = element.scrollLeft;
        const distanceToMove = targetPosition - startPosition;
        let timeElapsed = 0;
        const timeBetweenFrames = 16;

        element.style.scrollSnapType = 'none';

        const easeInOutQuart = (time, start, change, duration) => {
            time /= duration / 2;
            if (time < 1) return change / 2 * time * time * time * time + start;
            time -= 2;
            return -change / 2 * (time * time * time * time - 2) + start;
        };

        const moveStep = () => {
            timeElapsed += timeBetweenFrames;
            const newPosition = easeInOutQuart(timeElapsed, startPosition, distanceToMove, duration);
            element.scrollLeft = newPosition;

            if (timeElapsed < duration) {
                requestAnimationFrame(moveStep);
            } else {
                element.scrollLeft = targetPosition;
                element.style.scrollSnapType = 'x mandatory';
            }
        };

        requestAnimationFrame(moveStep);
    }

    function initCarousels() {
        const carouselContainers = $$('.carousel-container');

        carouselContainers.forEach(container => {
            const scrollingWrapper = $('.carousel-wrapper', container);
            const nextButton = $('.next-btn', container);
            const prevButton = $('.prev-btn', container);
            
            if (!scrollingWrapper) return;

            const isCategoryCarousel = container.classList.contains('category-carousel');
            let isCurrentlyAnimating = false;

            const handleScrollClick = (direction) => {
                if (isCurrentlyAnimating) return;
                isCurrentlyAnimating = true;

                const scrollAmount = isCategoryCarousel 
                    ? (scrollingWrapper.clientWidth / 3)
                    : scrollingWrapper.clientWidth;

                const targetScrollPosition = scrollingWrapper.scrollLeft + (direction * scrollAmount);
                
                animateScroll(scrollingWrapper, targetScrollPosition, 600);

                setTimeout(() => { isCurrentlyAnimating = false; }, 650);
            };

            if (nextButton) nextButton.addEventListener('click', () => handleScrollClick(1));
            if (prevButton) prevButton.addEventListener('click', () => handleScrollClick(-1));
        });
    }

    function initLightbox() {
        const modal = $('#lightbox-modal');
        const largeImage = $('#lightbox-img');
        const captionText = $('#lightbox-caption');
        const closeButton = $('.lightbox-close');

        if (!modal || !largeImage) return;

        const images = $$('.carousel-slide img');

        images.forEach(imgElement => {
            imgElement.style.cursor = 'zoom-in';

            imgElement.addEventListener('click', () => {
                const parentSlide = imgElement.closest('.carousel-slide');
                const title = parentSlide.querySelector('h3')?.textContent || '';
                
                largeImage.src = imgElement.src;
                captionText.textContent = title;
                
                modal.classList.add('open');
                document.body.style.overflow = 'hidden';
            });
        });

        const hideModal = () => {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        };

        if (closeButton) closeButton.addEventListener('click', hideModal);

        modal.addEventListener('click', (event) => {
            if (event.target === modal) hideModal();
        });

        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') hideModal();
        });
    }

    const CATEGORY_PRICING = {
        "Voice Acting": [
            { tier: "Silver Tier", price: "₱1,500", features: ["Up to 100 words", "1 Revision", "High-Quality MP3", "48h Delivery"] },
            { tier: "Gold Tier", price: "₱3,000", features: ["Up to 300 words", "3 Revisions", "WAV + MP3 Format", "24h Delivery", "Commercial Rights"] },
            { tier: "Diamond Tier", price: "₱6,000", features: ["Up to 1000 words", "Unlimited Revisions", "Raw Source Files", "Priority Delivery", "Full Broadcast Rights"] }
        ],
        "Photo & Video Editing": [
            { tier: "Silver Tier", price: "₱1,250", features: ["Basic Cut & Trim", "Color Correction", "Up to 5 minutes", "1 Revision"] },
            { tier: "Gold Tier", price: "₱3,750", features: ["Advanced Transitions", "Color Grading", "Text & Overlays", "Up to 15 minutes", "3 Revisions"] },
            { tier: "Diamond Tier", price: "₱7,500", features: ["Cinematic Editing", "Motion Graphics", "Sound Design", "Up to 30 minutes", "Unlimited Revisions"] }
        ],
        "Game Assets Designing": [
            { tier: "Silver Tier", price: "₱1,750", features: ["1 Character Sprite", "Idle Animation", "16x16 / 32x32 size", "2 Revisions"] },
            { tier: "Gold Tier", price: "₱4,000", features: ["Up to 3 Characters", "Full Animation Set", "Tileset (1 biome)", "Commercial Use"] },
            { tier: "Diamond Tier", price: "₱10,000", features: ["Full Game Asset Pack", "Custom UI Elements", "HD Assets (Vector/High-res)", "Ongoing Support"] }
        ],
        "Graphics Designing": [
            { tier: "Silver Tier", price: "₱1,000", features: ["1 Initial Concept", "Flyer or Poster", "High-Res JPEG/PNG", "2 Revisions"] },
            { tier: "Gold Tier", price: "₱2,500", features: ["2 Concepts", "Logo or Full Branding", "Source Files (PSD/AI)", "4 Revisions"] },
            { tier: "Diamond Tier", price: "₱5,000", features: ["4 Concepts", "Full Social Media Kit", "Brand Style Guide", "Unlimited Revisions"] }
        ],
        "Web Designing": [
            { tier: "Silver Tier", price: "₱4,000", features: ["1 Landing Page Design", "Responsive Layout", "Figma File", "2 Revisions"] },
            { tier: "Gold Tier", price: "₱12,500", features: ["Up to 5 Pages", "Prototyping & Flow", "Component Library", "5 Revisions"] },
            { tier: "Diamond Tier", price: "₱25,000", features: ["Full Website Design", "Advanced Interaction", "Design System", "Unlimited Revisions"] }
        ]
    };

    const pricingModal = $('#pricing-modal');
    const pricingCloseButton = $('#pricing-modal-close');
    const pricingGrid = $('#pricing-grid');
    const pricingHeading = $('#pricing-modal-heading');

    function showPricingForCategory(categoryName) {
        if (!pricingModal || !pricingGrid) return;

        pricingHeading.textContent = `${categoryName} - Pricing`;
        
        pricingGrid.innerHTML = '';

        const plans = CATEGORY_PRICING[categoryName] || CATEGORY_PRICING["Graphics Designing"];

        plans.forEach(plan => {
            const featuresHtml = plan.features
                .map(feature => `<li><i class="fa-solid fa-check"></i> ${feature}</li>`)
                .join('');
            
            let colorClass = '';
            if (plan.tier.includes('Silver')) colorClass = 'tier-silver';
            else if (plan.tier.includes('Gold')) colorClass = 'tier-gold';
            else if (plan.tier.includes('Diamond')) colorClass = 'tier-diamond';

            pricingGrid.innerHTML += `
                <div class="pricing-tier ${colorClass}">
                    <h4 class="tier-name">${plan.tier}</h4>
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

    function hidePricingModal() {
        if (!pricingModal) return;
        pricingModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    const pricingButtons = $$('.btn-pricing');
    
    pricingButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const categoryName = btn.getAttribute('data-category');
            showPricingForCategory(categoryName);
        });
    });

    if (pricingCloseButton) {
        pricingCloseButton.addEventListener('click', hidePricingModal);
    }
    if (pricingModal) {
        pricingModal.addEventListener('click', (event) => {
            if (event.target === pricingModal) hidePricingModal();
        });
    }

    initCarousels();
    initLightbox();
});
