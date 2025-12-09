document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const scene = document.getElementById('scene');
    const passportContainer = document.getElementById('passport-container');
    const elementsContainer = document.getElementById('elements-container');

    const themeSelect = document.getElementById('theme-select');
    const customText = document.getElementById('custom-text');
    const passportPhotoInput = document.getElementById('passport-photo-input');
    const passportNameInput = document.getElementById('passport-name-input');
    const passportPhotoDisplay = document.getElementById('passport-photo-display');
    const passportNameDisplay = document.getElementById('passport-name-display');
    const passportData = document.getElementById('passport-data');
    const editModal = document.getElementById('edit-modal');
    const textReveal = document.querySelector('.text-reveal');

    // Init Text pos
    textReveal.style.setProperty('--tx', '0px');
    textReveal.style.setProperty('--ty', '0px');

    // Buttons
    const editBtn = document.getElementById('edit-btn');
    const exportBtn = document.getElementById('export-btn');
    const closeBtn = document.getElementById('close-modal');
    const saveBtn = document.getElementById('save-btn');

    // State
    const defaultPolaroids = [
        'assets/polaroid1.png', 'assets/polaroid2.png', 'assets/polaroid3.png',
        'assets/polaroid1.png', 'assets/polaroid2.png', 'assets/polaroid3.png'
    ];
    let userImages = [...defaultPolaroids];
    let currentTheme = 'holiday';

    // Drag State
    let isDragging = false;
    let dragItem = null;
    let dragOffset = { x: 0, y: 0 };
    let initialTransform = { tx: 0, ty: 0 };

    // Themes Configuration
    const PRESETS = {
        holiday: {
            emojis: ['✈️', '🍬', '⭐', '❄️', '🎁', '🎄', '🦌', '🔔', '🕯️', '🍪', '🛷', '🎹'],
            gradient: 'linear-gradient(to bottom, #1e293b 0%, #0f172a 100%)',
            primary: '#fec021ff',
            frame: 'rgba(251, 191, 36, 0.3)',
            font: "'Great Vibes', cursive",
            defaultText: "Happy Holidays"
        },
        beach: {
            emojis: ['🏖️', '☀️', '🍹', '🌴', '👙', '🌊', '🍦', '🕶️', '🦀', '🐬', '🐚', '⛵'],
            gradient: 'linear-gradient(to bottom, #f37021 0%,  #faf1ecff 50%, #27aae1 100%)',
            primary: '#ffa703',
            frame: 'rgba(255, 255, 255, 0.5)',
            font: "'Lobster', cursive",
            defaultText: "Summer Vibes"
        },
        mountain: {
            emojis: ['🏔️', '⛷️', '☕', '🧣', '🌲', '🔥', '🚡', '🦉', '⛺', '🧤', '🐺', '❄️'],
            gradient: 'linear-gradient(to bottom, #e6e7e8 0%, #2c6e76ff 100%)',
            primary: '#02fdadff',
            frame: 'rgba(0, 253, 152, 0.27)',
            font: "'Playfair Display', serif",
            defaultText: "Winter Escape"
        },
        food: {
            emojis: ['🍕', '🍔', '🍟', '🍷', '🍝', '🥗', '👨‍🍳', '🍰', '🍣', '🍩', '🥑', '🥞'],
            gradient: 'linear-gradient(to bottom, #d9451f 0%, #be2f26 100%)',
            primary: '#f3c50d',
            frame: 'rgba(253, 224, 71, 0.6)',
            font: "'Modak', cursive",
            defaultText: "Bon Appétit"
        },
        party: {
            emojis: ['🎉', '🎈', '👯', '🥳', '🪩', '🍰', '🍾', '🎆', '🕺', '💃', '🎵', '🎭'],
            gradient: 'linear-gradient(to bottom, #330e4bff 0%, #fd1d1d 100%)',
            primary: '#ffffffff',
            frame: 'rgba(217, 70, 239, 0.5)',
            font: "'Bungee', cursive",
            defaultText: "Let's Party!"
        }
    };

    // --- Interaction ---
    passportContainer.addEventListener('click', (e) => {
        // Prevent toggling if clicking on a floating element (e.g. dragging)
        if (e.target.closest('.floating-element')) return;

        // Only toggle active if we are not already editing, but here we just toggle
        if (!scene.classList.contains('active')) {
            // Switch to Open Passport
            const passport = document.getElementById('passport');
            passport.src = 'assets/passport open.svg';
            passportContainer.style.width = '450px'; // Reduced from 540px
            passportData.classList.remove('hidden'); // Show Data

            renderScene();
            elementsContainer.getBoundingClientRect();
            requestAnimationFrame(() => scene.classList.add('active'));
        } else {
            scene.classList.remove('active');
            passportContainer.style.width = '200px'; // Reduced from 240px
            passportData.classList.add('hidden'); // Hide Data

            // Revert to Closed Passport after transition
            const passport = document.getElementById('passport');
            passport.src = 'assets/passport.svg';
        }
    });

    // Global Drag Handlers
    document.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);

    // Touch Support
    document.addEventListener('touchstart', (e) => startDrag(e.touches[0]));
    document.addEventListener('touchmove', (e) => drag(e.touches[0]));
    document.addEventListener('touchend', endDrag);

    function startDrag(e) {
        if (!scene.classList.contains('active')) return;
        const target = e.target.closest('.floating-element') || e.target.closest('.text-reveal');
        if (!target) return;

        e.preventDefault ? e.preventDefault() : null;

        isDragging = true;
        dragItem = target;
        dragItem.style.cursor = 'grabbing';
        dragItem.style.zIndex = '1000'; // Bring to front

        // Get current values or default to 0 if missing
        const txVal = dragItem.style.getPropertyValue('--tx');
        const tyVal = dragItem.style.getPropertyValue('--ty');

        const tx = txVal ? parseFloat(txVal) : 0;
        const ty = tyVal ? parseFloat(tyVal) : 0;

        initialTransform = { tx, ty };
        dragOffset = {
            x: e.clientX,
            y: e.clientY
        };

        dragItem.style.transition = 'none';
    }

    function drag(e) {
        if (!isDragging || !dragItem) return;

        // Calculate delta
        const dx = e.clientX - dragOffset.x;
        const dy = e.clientY - dragOffset.y;

        const newTx = initialTransform.tx + dx;
        const newTy = initialTransform.ty + dy;

        dragItem.style.setProperty('--tx', `${newTx}px`);
        dragItem.style.setProperty('--ty', `${newTy}px`);
    }

    function endDrag() {
        if (!isDragging || !dragItem) return;
        dragItem.style.transition = ''; // Restore transition
        dragItem.style.cursor = ''; // Reset cursor
        dragItem.style.zIndex = ''; // Reset z-index (or keep it high?)
        isDragging = false;
        dragItem = null;
    }


    // --- Rendering & Physics ---
    function renderScene() {
        elementsContainer.innerHTML = '';
        const config = PRESETS[currentTheme];

        // Prepare items
        const polaroids = userImages.map(src => ({ type: 'polaroid', src, w: 220, h: 200 }));

        // Emojis: Ensure NO REPEATS and enough count
        // Shuffle and take top 10 (or as many as needed)
        const emojiPool = [...config.emojis].sort(() => 0.5 - Math.random());
        const neededEmojis = 12;
        // If pool is smaller, we loop.
        const selectedEmojis = [];
        for (let i = 0; i < neededEmojis; i++) {
            selectedEmojis.push(emojiPool[i % emojiPool.length]);
        }

        const emojiItems = selectedEmojis.map(emoji => ({ type: 'emoji', content: emoji, w: 50, h: 50 }));

        const allItems = [...polaroids, ...emojiItems];

        // --- Uniform Radial Distribution ---
        // We have N items. We want them in a circle around the center.
        // Actually best is 2 circles. Inner for Polaroids, Outer for Emojis.
        // Or interleaved. 
        // User said "Uniformly distributed in all directions". 
        // Let's do a strict radial mapping based on index.

        const n = allItems.length;
        // Shuffle allItems so polaroids aren't clustered?
        // Actually user said "images in bottom, passport top". That's layering.
        // If they meant vertical screen position, that's different.
        // Assuming user meant z-index layering (passport on top of images).

        // Let's shuffle positions but keep polaroids somewhat central if possible.
        // Actually, Uniform Distribution usually implies 360/N.

        // Let's try separate rings.
        // Ring 1: Polaroids (6 items) -> 60 deg apart. Distance ~250px.
        // Ring 2: Emojis (12 items) -> 30 deg apart. Distance ~350px.

        const stepP = (Math.PI * 2) / polaroids.length;
        const stepE = (Math.PI * 2) / emojiItems.length;
        const angleOffsetP = Math.random() * Math.PI; // Random start angle
        const angleOffsetE = Math.random() * Math.PI;

        // Place Polaroids
        polaroids.forEach((item, i) => {
            const angle = angleOffsetP + (i * stepP);
            const dist = 250; // Reduced from 320
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            createAndPlace(item, x, y);
        });

        // Place Emojis
        emojiItems.forEach((item, i) => {
            const angle = angleOffsetE + (i * stepE);
            const dist = 340; // Reduced from 420
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            createAndPlace(item, x, y);
        });
    }

    function createAndPlace(item, x, y) {
        const el = document.createElement('div');
        el.className = item.type === 'polaroid' ? 'floating-element polaroid' : 'floating-element emoji-element';

        if (item.type === 'polaroid') {
            const img = document.createElement('img');
            img.src = item.src;
            img.ondragstart = () => false;
            el.appendChild(img);
        } else {
            el.textContent = item.content;
            el.style.fontSize = (2 + Math.random() * 2) + 'rem';
        }

        // Initial 0 pos
        el.style.setProperty('--tx', '0px');
        el.style.setProperty('--ty', '0px');
        el.style.setProperty('--rot', '0deg');
        el.style.setProperty('--scale', '0');

        // Final Pos
        el.dataset.finalTx = x + 'px';
        el.dataset.finalTy = y + 'px';
        el.dataset.finalRot = (Math.random() * 30 - 15) + 'deg';
        el.dataset.finalScale = item.type === 'emoji' ? (0.8 + Math.random() * 0.4) : (0.9 + Math.random() * 0.2);

        el.style.setProperty('--tx', el.dataset.finalTx);
        el.style.setProperty('--ty', el.dataset.finalTy);
        el.style.setProperty('--rot', el.dataset.finalRot);
        el.style.setProperty('--scale', el.dataset.finalScale);

        elementsContainer.appendChild(el);
    }


    // --- Modal Logic ---
    const openModal = () => { editModal.classList.remove('hidden'); };
    const closeModal = () => { editModal.classList.add('hidden'); };

    editBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Save Logic (Theme + Text + Images)
    saveBtn.addEventListener('click', () => {
        // 1. Update Theme
        const selectedTheme = themeSelect.value;
        if (selectedTheme !== currentTheme) {
            applyTheme(selectedTheme);
        }

        // 2. Update Text
        textRevealH1.textContent = customText.value;

        // 2b. Update Passport Details
        if (passportNameInput.value) {
            passportNameDisplay.textContent = passportNameInput.value;
        }
        if (passportPhotoInput.files && passportPhotoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                passportPhotoDisplay.src = e.target.result;
            }
            reader.readAsDataURL(passportPhotoInput.files[0]);
        }

        // 3. Update Images
        const bulkInput = document.getElementById('bulk-photo-upload');
        if (bulkInput && bulkInput.files && bulkInput.files.length > 0) {
            const files = Array.from(bulkInput.files);
            const readers = [];

            files.forEach(file => {
                readers.push(new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                }));
            });

            Promise.all(readers).then(images => {
                if (images.length === 0) {
                    finishSave(true);
                    return;
                }
                let finalImages = [...images];
                while (finalImages.length < 6) finalImages = finalImages.concat(images);
                if (finalImages.length > 12) finalImages = finalImages.slice(0, 12);

                userImages = finalImages;
                finishSave(true);
            });
        } else {
            finishSave(true); // Always re-render to apply theme changes if any
        }
    });

    function applyTheme(name) {
        currentTheme = name;
        const config = PRESETS[name];
        document.documentElement.style.setProperty('--bg-gradient', config.gradient);
        document.documentElement.style.setProperty('--primary-color', config.primary);
        document.documentElement.style.setProperty('--frame-color', config.frame);
        document.documentElement.style.setProperty('--font-heading', config.font);
        document.documentElement.style.setProperty('--heading-size', config.fontSize || '5rem');

        // If applying default text when switching? Maybe not, keep user text.
        // textRevealH1.textContent = config.defaultText;
    }

    function finishSave(shouldRender = true) {
        // Only render if scene is active, OR if we want to reset.
        // User said "The sketch will change only when I click on passport or I click update sketch."
        // So clicking Update should render.
        scene.classList.remove('active'); // Reset first?
        setTimeout(() => {
            renderScene(); // Prepare new DOM
            // If we want it to auto-open after update:
            requestAnimationFrame(() => scene.classList.add('active'));
        }, 300);

        closeModal();
    }

    // --- Export Logic ---
    exportBtn.addEventListener('click', () => {
        // 1. Hide Controls
        const controls = document.querySelector('.controls-area');
        controls.style.display = 'none';

        // 2. Capture
        html2canvas(document.body, {
            scale: 2, // Better quality
            useCORS: true, // Specific for local/external images
            backgroundColor: null
        }).then(canvas => {
            // 3. Download
            const link = document.createElement('a');
            link.download = `sketch-export-${currentTheme}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            // 4. Show Controls
            controls.style.display = 'flex';
        }).catch(err => {
            console.error('Export failed:', err);
            alert('Export failed! If you are running this locally without a server, browser security might block saving the image. Please try running via a local server (e.g., Live Server).');
            controls.style.display = 'flex';
        });
    });

    // Init
    applyTheme('holiday');
    editModal.classList.add('hidden');
});
