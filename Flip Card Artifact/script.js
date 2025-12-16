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
    let ignoreNextClick = false;
    const IDLE_DELAY = 5000;

    // --- Reset Logic Helper ---
    const resetBook = () => {
        // 1. Reset Flip State
        flipContainers.forEach(c => c.classList.remove('flipped'));

        // 2. Reset Colors
        root.style.removeProperty('--base-bg-color');
        if (baseColorInput) baseColorInput.value = "#FFD500";

        // 3. Reset Images to Default (all 6 layers)
        const defaultImages = [
            { img: 'Assets/dude 1.png', layer: 1, isLeft: true },
            { img: 'Assets/dude 2.png', layer: 1, isLeft: false },
            { img: 'Assets/dude 3.png', layer: 2, isLeft: true },
            { img: 'Assets/dude 4.png', layer: 2, isLeft: false },
            { img: 'Assets/dude 5.png', layer: 3, isLeft: true },
            { img: 'Assets/dude 6.png', layer: 3, isLeft: false }
        ];

        defaultImages.forEach(({ img, layer, isLeft }) => {
            updateCoverSize(img, layer, isLeft);
        });

        // 4. Reset Inputs
        // 4. Reset Inputs
        for (let i = 1; i <= 6; i++) {
            const input = document.getElementById(`upload-img-${i}`);
            if (input) input.value = "";
        }

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

            // Helper to determine which side a card is currently visually on
            const getCardSide = (c) => {
                const isLeftContainer = c.classList.contains('left');
                const isFlipped = c.classList.contains('flipped');

                // Left Container: Not Flipped -> Left, Flipped -> Right
                if (isLeftContainer) return isFlipped ? 'right' : 'left';

                // Right Container: Not Flipped -> Right, Flipped -> Left
                return isFlipped ? 'left' : 'right';
            };

            flipContainers.forEach((container, index) => {
                // Check physics (stacking order)
                const canFlip = canFlipCard(container);
                if (!canFlip) return;

                // Check constraint: Never empty a side
                const row = container.closest('.row');
                const currentSide = getCardSide(container);

                // Count how many cards are currently on this side in this row
                const rowContainers = Array.from(row.querySelectorAll('.flip-container'));
                const countOnSide = rowContainers.reduce((count, c) => {
                    return count + (getCardSide(c) === currentSide ? 1 : 0);
                }, 0);

                // If this is the last one, don't flip it
                if (countOnSide <= 1) return;

                availableCards.push({ container, index });
            });

            // If no cards can be flipped (e.g. paused or constrained), check again soon
            if (availableCards.length === 0) {
                autoFlipTimer = setTimeout(performRandomFlip, 2000);
                return;
            }

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
        const isFlipped = container.classList.contains('flipped');

        // Get all containers in the same row and side
        const sameRowSide = Array.from(row.querySelectorAll(`.flip-container.${isLeft ? 'left' : 'right'}`));

        if (!isFlipped) {
            // OPENING: Require Layers 1..Current-1 to be FLIPPED (Top to Bottom)
            for (let layer = 1; layer < currentLayer; layer++) {
                const upperLayer = sameRowSide.find(c => getLayerNumber(c) === layer);
                if (upperLayer && !upperLayer.classList.contains('flipped')) {
                    // Upper layer not flipped, can't flip this one
                    return false;
                }
            }
        } else {
            // CLOSING: Require Layers Current+1..Max to be NOT FLIPPED (Bottom to Top)
            // Assuming max 3 layers
            for (let layer = currentLayer + 1; layer <= 3; layer++) {
                const lowerLayer = sameRowSide.find(c => getLayerNumber(c) === layer);
                if (lowerLayer && lowerLayer.classList.contains('flipped')) {
                    // Lower layer (physically on top when flipped) is still flipped, can't close this one
                    return false;
                }
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
            ignoreNextClick = true;

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

    // Start immediate auto-flip (Moved to animateOpening)
    // startAutoFlip(); 

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
    // Update selector to include cover for manual flipping if desired, 
    // or keep it auto-only. User implied "cover to flip open", usually implies manual interaction too?
    // Let's allow manual flip for cover too.
    const allFlipContainers = document.querySelectorAll('.flip-container');
    allFlipContainers.forEach((container) => {
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
            if (ignoreNextClick) {
                ignoreNextClick = false;
                return;
            }
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
            if (ignoreNextClick) {
                ignoreNextClick = false;
                return;
            }
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
    // IDs: upload-img-1 to upload-img-6
    // Map ID -> { layer, isLeft }
    const inputConfig = [
        { id: 'upload-img-1', layer: 1, isLeft: true },
        { id: 'upload-img-2', layer: 1, isLeft: false },
        { id: 'upload-img-3', layer: 2, isLeft: true },
        { id: 'upload-img-4', layer: 2, isLeft: false },
        { id: 'upload-img-5', layer: 3, isLeft: true },
        { id: 'upload-img-6', layer: 3, isLeft: false }
    ];

    const handleUpload = (input, layer, isLeft) => {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            updateCoverSize(e.target.result, layer, isLeft);
        };
        reader.readAsDataURL(file);
    };

    inputConfig.forEach(config => {
        const input = document.getElementById(config.id);
        if (input) {
            input.addEventListener('change', (e) => handleUpload(e.target, config.layer, config.isLeft));
        }
    });

    // --- Reset ---
    // --- Reset ---
    if (resetBtn) {
        resetBtn.addEventListener('click', resetBook);
    }

    // --- Initialization ---
    // Calculate correct sizing for default images on load
    // --- Initialization ---
    window.addEventListener('load', () => {
        // Initialize all 6 layer images
        updateCoverSize('Assets/dude 1.png', 1, true);
        updateCoverSize('Assets/dude 2.png', 1, false);
        updateCoverSize('Assets/dude 3.png', 2, true);
        updateCoverSize('Assets/dude 4.png', 2, false);
        updateCoverSize('Assets/dude 5.png', 3, true);
        updateCoverSize('Assets/dude 6.png', 3, false);

        // Start Auto-flip immediately
        startAutoFlip();
    });
});
