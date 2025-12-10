document.addEventListener('DOMContentLoaded', () => {
    const flipContainers = document.querySelectorAll('.flip-container');
    const baseColorInput = document.getElementById('base-bg-color');
    const resetBtn = document.getElementById('reset-btn');
    const root = document.documentElement;

    // --- Idle Auto-Flip Logic ---
    let idleTimer;
    let autoFlipTimer;
    let isAutoFlipping = false;
    let isPermanentlyDisabled = false;
    let savedFlipState = [];
    const IDLE_DELAY = 5000;

    // --- Reset Logic Helper ---
    const resetBook = () => {
        // 1. Reset Flip State
        flipContainers.forEach(c => c.classList.remove('flipped'));

        // 2. Reset Colors
        root.style.removeProperty('--base-bg-color');
        if (baseColorInput) baseColorInput.value = "#333333";

        // 3. Reset Images to Default (all 6 layers)
        const defaultImages = [
            { img: 'Assets/person 1.jpg', layer: 1, isLeft: true },
            { img: 'Assets/person 2.jpg', layer: 1, isLeft: false },
            { img: 'Assets/person 3.jpg', layer: 2, isLeft: true },
            { img: 'Assets/person 4.jpg', layer: 2, isLeft: false },
            { img: 'Assets/person 5.jpg', layer: 3, isLeft: true },
            { img: 'Assets/person 6.jpg', layer: 3, isLeft: false }
        ];

        defaultImages.forEach(({ img, layer, isLeft }) => {
            updateCoverSize(img, layer, isLeft);
        });

        // 4. Reset Inputs
        if (leftUpload) leftUpload.value = "";
        if (rightUpload) rightUpload.value = "";

        // 5. Cleanup Animation Classes
        flipContainers.forEach(c => c.classList.remove('is-animating'));
    };

    const startAutoFlip = () => {
        // Stop any existing cycle
        clearTimeout(autoFlipTimer);

        // Save current state
        isAutoFlipping = true;
        savedFlipState = Array.from(flipContainers).map(c => c.classList.contains('flipped'));

        const performRandomFlip = () => {
            if (!isAutoFlipping) return;
            if (flipContainers.length === 0) return;

            // Get all available cards that can be flipped
            const availableCards = [];

            flipContainers.forEach((container, index) => {
                // Check if this card can be flipped based on layer rules
                const canFlip = canFlipCard(container);
                if (canFlip) {
                    availableCards.push({ container, index });
                }
            });

            // If no cards can be flipped, stop
            if (availableCards.length === 0) return;

            // Pick a random available card
            const randomChoice = availableCards[Math.floor(Math.random() * availableCards.length)];
            const container = randomChoice.container;

            // Flip it
            container.classList.add('is-animating');
            container.classList.toggle('flipped');
            setTimeout(() => {
                container.classList.remove('is-animating');
            }, 800);

            // Schedule next flip 2-4 seconds later (Natural Gap)
            const nextDelay = 2000 + Math.random() * 2000;
            autoFlipTimer = setTimeout(performRandomFlip, nextDelay);
        };

        performRandomFlip();
    };

    // Helper function to check if a card can be flipped
    const canFlipCard = (container) => {
        // Get the row and side of this container
        const row = container.closest('.row');
        if (!row) return false;

        const isLeft = container.classList.contains('left');
        const currentLayer = getLayerNumber(container);

        // Get all containers in the same row and side
        const sameRowSide = Array.from(row.querySelectorAll(`.flip-container.${isLeft ? 'left' : 'right'}`));

        // Check if all layers above this one are flipped
        for (let layer = 1; layer < currentLayer; layer++) {
            const upperLayer = sameRowSide.find(c => getLayerNumber(c) === layer);
            if (upperLayer && !upperLayer.classList.contains('flipped')) {
                // Upper layer not flipped, can't flip this one
                return false;
            }
        }

        return true;
    };

    // Helper function to get layer number from container
    const getLayerNumber = (container) => {
        if (container.classList.contains('layer-1')) return 1;
        if (container.classList.contains('layer-2')) return 2;
        if (container.classList.contains('layer-3')) return 3;
        return 0;
    };

    const resetIdleTimer = (e) => {
        // 0. If permanently disabled, do nothing
        if (isPermanentlyDisabled) return;

        // Ignore passive events
        if (e && (e.type === 'mousemove' || e.type === 'scroll')) {
            return;
        }

        // If Screensaver is active...
        if (isAutoFlipping) {
            // ONLY stop if clicking a card OR the Remix button
            if (!e) return;

            const target = e.target;
            const isCard = target.closest('.flip-container');
            const isRemixBtn = target.closest('#remix-toggle-btn');

            // If not clicking card or remix button, ignore
            if (!isCard && !isRemixBtn) return;

            // STOP Screensaver
            isAutoFlipping = false;
            clearTimeout(autoFlipTimer);

            // FULL RESET (always reset to default when stopping)
            resetBook();

            // PERMANENTLY DISABLE
            isPermanentlyDisabled = true;
            clearTimeout(idleTimer);
            flipContainers.forEach(c => c.classList.remove('is-animating'));
            return;
        }

        // If NOT auto-flipping...
        // Check if user clicked card or remix button - if so, disable forever
        if (e && (e.type === 'click' || e.type === 'mousedown' || e.type === 'touchstart')) {
            const target = e.target;
            const isCard = target.closest('.flip-container');
            const isRemixBtn = target.closest('#remix-toggle-btn');

            if (isCard || isRemixBtn) {
                isPermanentlyDisabled = true;
                clearTimeout(idleTimer);
                clearTimeout(autoFlipTimer);
                return;
            }
        }

        // Otherwise, reset the idle timer normally
        clearTimeout(idleTimer);
        clearTimeout(autoFlipTimer);
        idleTimer = setTimeout(startAutoFlip, IDLE_DELAY);
    };

    // Listen for interaction to reset timer
    // Listen for interaction to reset timer
    // Removed 'mousemove' and 'scroll' so cursor movement doesn't prevent idle
    window.addEventListener('mousedown', resetIdleTimer);
    window.addEventListener('keypress', resetIdleTimer);
    window.addEventListener('touchstart', resetIdleTimer);

    // Start initial timer
    resetIdleTimer();

    // --- Menu Logic ---
    const menu = document.getElementById('remix-menu');
    const toggleBtn = document.getElementById('remix-toggle-btn');

    if (toggleBtn && menu) {
        toggleBtn.addEventListener('click', () => {
            menu.classList.toggle('open');
        });
    }

    // Close menu when clicking outside (optional polish)
    document.addEventListener('click', (e) => {
        if (menu && menu.classList.contains('open') &&
            !menu.contains(e.target) &&
            !toggleBtn.contains(e.target)) {
            menu.classList.remove('open');
        }
    });

    // --- Flip Logic ---
    flipContainers.forEach((container) => {
        // Toggle flip with animation class
        const toggleFlip = () => {
            container.classList.add('is-animating');
            container.classList.toggle('flipped');
            setTimeout(() => {
                container.classList.remove('is-animating');
            }, 800);
        };

        // Click logic
        let isDragging = false;
        let startX, startY;

        container.addEventListener('mousedown', (e) => {
            isDragging = false;
            startX = e.clientX;
            startY = e.clientY;
        });

        container.addEventListener('mousemove', (e) => {
            if (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5) {
                isDragging = true;
            }
        });

        container.addEventListener('mouseup', () => {
            if (!isDragging) toggleFlip();
        });

        // Touch handlers
        container.addEventListener('touchstart', (e) => {
            isDragging = false;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        container.addEventListener('touchmove', () => {
            isDragging = true;
        });

        container.addEventListener('touchend', () => {
            if (!isDragging) toggleFlip();
        });
    });

    // --- Image Handling Helpers ---

    /* 
       Calculates the 'cover' background-size for an image 
       relative to the .book container dimensions.
    */
    const updateCoverSize = (imgUrl, layer, isLeft) => {
        const img = new Image();
        img.onload = () => {
            const bookEl = document.querySelector('.book');
            if (!bookEl) return;
            const bookRect = bookEl.getBoundingClientRect();

            const container = document.querySelector('.flip-container');
            if (!container) return;

            const targetW = container.getBoundingClientRect().width;
            const targetH = bookEl.getBoundingClientRect().height;

            const imgW = img.width;
            const imgH = img.height;

            const targetRatio = targetW / targetH;
            const imgRatio = imgW / imgH;

            let bgSizeValue;

            if (imgRatio > targetRatio) {
                const newH = targetH;
                const newW = newH * imgRatio;
                bgSizeValue = `${newW}px ${newH}px`;
            } else {
                const newW = targetW;
                const newH = newW / imgRatio;
                bgSizeValue = `${newW}px ${newH}px`;
            }

            // Set layer-specific CSS variables
            const side = isLeft ? 'left' : 'right';
            const imageVar = `--layer${layer}-${side}-bg-image`;
            const sizeVar = `--layer${layer}-${side}-bg-size`;

            root.style.setProperty(imageVar, `url('${imgUrl}')`);
            root.style.setProperty(sizeVar, bgSizeValue);
        };
        img.src = imgUrl;
    };

    // --- Controls ---

    if (baseColorInput) {
        baseColorInput.addEventListener('input', (e) => {
            root.style.setProperty('--base-bg-color', e.target.value);
        });
    }

    // --- Image Inputs ---
    // IDs must match HTML: left-img-upload, right-img-upload
    const leftUpload = document.getElementById('left-img-upload');
    const rightUpload = document.getElementById('right-img-upload');

    const handleUpload = (input, isLeft) => {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            // Upload controls update layer 1 only
            updateCoverSize(e.target.result, 1, isLeft);
        };
        reader.readAsDataURL(file);
    };

    if (leftUpload) {
        leftUpload.addEventListener('change', (e) => handleUpload(e.target, true));
    }
    if (rightUpload) {
        rightUpload.addEventListener('change', (e) => handleUpload(e.target, false));
    }

    // --- Reset ---
    // --- Reset ---
    if (resetBtn) {
        resetBtn.addEventListener('click', resetBook);
    }

    // --- Initialization ---
    // Calculate correct sizing for default images on load
    window.addEventListener('load', () => {
        // Initialize all 6 layer images
        updateCoverSize('Assets/person 1.jpg', 1, true);
        updateCoverSize('Assets/person 2.jpg', 1, false);
        updateCoverSize('Assets/person 3.jpg', 2, true);
        updateCoverSize('Assets/person 4.jpg', 2, false);
        updateCoverSize('Assets/person 5.jpg', 3, true);
        updateCoverSize('Assets/person 6.jpg', 3, false);
    });
});
