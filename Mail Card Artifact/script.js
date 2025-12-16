// State
let state = {
    isFlipped: false,
    colors: {
        bg: '#F8F0D6',
        stamp: '#89CFF0',
        text: '#333333'
    }
};

// Signature canvas
const signatureCanvas = document.getElementById('signatureCanvas');
const signatureCtx = signatureCanvas.getContext('2d');
let isDrawingSignature = false;
let lastX = 0;
let lastY = 0;

// Initialize
function init() {
    // Set current date
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear().toString().substr(-2)}`;
    document.getElementById('dateDisplay').textContent = dateStr;

    // Apply default colors
    applyColors();

    // Event listeners
    document.getElementById('nameInput').addEventListener('input', updateStamp);
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);

    // Signature canvas events
    signatureCanvas.addEventListener('mousedown', startDrawingSignature);
    signatureCanvas.addEventListener('mousemove', drawSignature);
    signatureCanvas.addEventListener('mouseup', stopDrawingSignature);
    signatureCanvas.addEventListener('mouseout', stopDrawingSignature);

    // Touch events for signature
    signatureCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = signatureCanvas.getBoundingClientRect();
        lastX = touch.clientX - rect.left;
        lastY = touch.clientY - rect.top;
        isDrawingSignature = true;
    });

    signatureCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDrawingSignature) return;
        const touch = e.touches[0];
        const rect = signatureCanvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        signatureCtx.strokeStyle = state.colors.text;
        signatureCtx.lineWidth = 2;
        signatureCtx.lineCap = 'round';
        signatureCtx.lineJoin = 'round';

        signatureCtx.beginPath();
        signatureCtx.moveTo(lastX, lastY);
        signatureCtx.lineTo(x, y);
        signatureCtx.stroke();

        lastX = x;
        lastY = y;
    });

    signatureCanvas.addEventListener('touchend', () => {
        isDrawingSignature = false;
    });

    // Remix Feature Events
    const remixOverlay = document.getElementById('remixOverlay');

    document.getElementById('remixBtn').addEventListener('click', () => {
        remixOverlay.classList.remove('hidden');

        // Helper to format color for input - handles Hex or HSL
        const getColorForInput = (colorStr) => {
            if (colorStr.startsWith('#')) return colorStr;
            const match = colorStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (match) {
                return hslToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
            }
            return '#000000'; // fallback
        };

        // Update pickers with current state
        document.getElementById('cardColorPicker').value = getColorForInput(state.colors.bg);
        document.getElementById('cardColorValue').textContent = state.colors.bg;
        document.getElementById('stampColorPicker').value = getColorForInput(state.colors.stamp);
        document.getElementById('stampColorValue').textContent = state.colors.stamp;
    });

    document.getElementById('closeRemix').addEventListener('click', () => {
        remixOverlay.classList.add('hidden');
    });

    // Close on outside click
    remixOverlay.addEventListener('click', (e) => {
        if (e.target === remixOverlay) {
            remixOverlay.classList.add('hidden');
        }
    });

    // Card Color Picker
    const cardColorPicker = document.getElementById('cardColorPicker');
    cardColorPicker.addEventListener('input', (e) => {
        state.colors.bg = e.target.value;
        document.getElementById('cardColorValue').textContent = e.target.value;
        applyColors();
    });

    // Stamp Color Picker
    const stampColorPicker = document.getElementById('stampColorPicker');
    stampColorPicker.addEventListener('input', (e) => {
        state.colors.stamp = e.target.value;
        document.getElementById('stampColorValue').textContent = e.target.value;
        applyColors();
    });

    // Background Image Upload
    document.getElementById('bgImageInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.body.style.backgroundImage = `url('${event.target.result}')`;

                // Update file label to show filename
                const label = document.querySelector('label[for="bgImageInput"]');
                if (label) label.textContent = file.name;
            };
            reader.readAsDataURL(file);
        }
    });
}


// Signature drawing functions
function startDrawingSignature(e) {
    isDrawingSignature = true;
    const rect = signatureCanvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
}

function drawSignature(e) {
    if (!isDrawingSignature) return;

    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    signatureCtx.strokeStyle = state.colors.text;
    signatureCtx.lineWidth = 2;
    signatureCtx.lineCap = 'round';
    signatureCtx.lineJoin = 'round';

    signatureCtx.beginPath();
    signatureCtx.moveTo(lastX, lastY);
    signatureCtx.lineTo(x, y);
    signatureCtx.stroke();

    lastX = x;
    lastY = y;
}

function stopDrawingSignature() {
    isDrawingSignature = false;
}

function clearSignature() {
    signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
}

// Card flip
function flipCard() {
    state.isFlipped = !state.isFlipped;
    const cardInner = document.getElementById('cardInner');
    if (state.isFlipped) {
        cardInner.classList.add('flipped');
    } else {
        cardInner.classList.remove('flipped');
    }
}

// Update stamp with name
function updateStamp() {
    const stampText = document.getElementById('stampText');
    const name = document.getElementById('nameInput').value;
    stampText.textContent = name || 'INSERT NAME';
}

// Image upload
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const img = document.getElementById('uploadedImage');
            const placeholder = document.getElementById('uploadPlaceholder');
            img.src = reader.result;
            img.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

// Color functions
function getRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 100%, 85%)`;
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function getComplementaryColor(hslString) {
    const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return 'hsl(0, 0%, 50%)';

    let h = parseInt(match[1]);
    const s = parseInt(match[2]);
    const l = parseInt(match[3]);

    const compH = (h + 180) % 360;
    return `hsl(${compH}, ${s}%, ${Math.max(l - 20, 40)}%)`;
}


function randomizeColors() {
    const bg = getRandomPastelColor();
    const stamp = getComplementaryColor(bg);
    state.colors = {
        bg,
        stamp,
        text: '#333333'
    };
    applyColors();
}

function applyColors() {
    const front = document.getElementById('cardFront');
    const back = document.getElementById('cardBack');
    const stampBox = document.getElementById('stampBox');
    const nameInput = document.getElementById('nameInput');
    const dateDisplay = document.getElementById('dateDisplay');
    const messageInput = document.getElementById('messageInput');
    const signatureBox = document.getElementById('signatureBox');
    const uploadArea = document.getElementById('uploadArea');
    const frontMessageInput = document.getElementById('frontMessageInput');

    // Front
    front.style.backgroundColor = state.colors.bg;
    front.style.color = state.colors.text;
    uploadArea.style.borderColor = state.colors.text;
    frontMessageInput.style.color = state.colors.text;
    frontMessageInput.style.borderBottomColor = state.colors.text;

    // Back
    back.style.backgroundColor = state.colors.bg;
    back.style.color = state.colors.text;
    nameInput.style.color = state.colors.text;
    nameInput.style.borderColor = state.colors.text;
    dateDisplay.style.borderColor = state.colors.text;
    messageInput.style.color = state.colors.text;
    messageInput.style.backgroundImage = `linear-gradient(${state.colors.text}20 1px, transparent 1px)`;
    signatureBox.style.borderColor = state.colors.text;
    document.querySelector('.signature-label').style.color = state.colors.text;
    stampBox.style.color = state.colors.stamp;
    stampBox.style.borderColor = state.colors.stamp;
}

// Reset
function resetCard() {
    // Reset state
    state.isFlipped = false;
    state.colors = {
        bg: '#F8F0D6',
        stamp: '#89CFF0',
        text: '#333333'
    };

    // Reset UI - Front
    document.getElementById('frontMessageInput').value = '';
    document.getElementById('imageInput').value = '';

    const img = document.getElementById('uploadedImage');
    const placeholder = document.getElementById('uploadPlaceholder');
    img.style.display = 'none';
    img.src = '';
    placeholder.style.display = 'block';

    // Reset UI - Back
    document.getElementById('nameInput').value = '';
    document.getElementById('messageInput').value = '';

    clearSignature();
    updateStamp();
    applyColors();

    // Reset flip
    const cardInner = document.getElementById('cardInner');
    cardInner.classList.remove('flipped');
}

// Save as PNG - export sides exactly as they appear
async function saveAsPNG() {
    if (typeof html2canvas === 'undefined') {
        alert('Export functionality is not available.');
        return;
    }

    const frontHasContent = hasFrontContent();
    const backHasContent = hasBackContent();

    if (!frontHasContent && !backHasContent) {
        alert('Please add some content to the card before exporting.');
        return;
    }

    const exports = [];
    if (frontHasContent) {
        exports.push({ side: 'front', filename: 'mail-card-front.png' });
    }
    if (backHasContent) {
        exports.push({ side: 'back', filename: 'mail-card-back.png' });
    }

    const cardInner = document.getElementById('cardInner');
    const cardContainer = document.querySelector('.card-container');
    const cardFront = document.getElementById('cardFront');
    const cardBack = document.getElementById('cardBack');

    // Remember original state
    const wasFlipped = cardInner.classList.contains('flipped');
    const originalFrontVisibility = cardFront.style.visibility || '';
    const originalBackVisibility = cardBack.style.visibility || '';

    for (const exp of exports) {
        // Show only the relevant side in the DOM before capturing
        if (exp.side === 'front') {
            cardInner.classList.remove('flipped');
            cardFront.style.visibility = 'visible';
            cardBack.style.visibility = 'hidden';
        } else {
            cardInner.classList.add('flipped');
            cardFront.style.visibility = 'hidden';
            cardBack.style.visibility = 'visible';
        }

        try {
            const canvas = await html2canvas(cardContainer, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,


                onclone: (clonedDoc) => {
                    const originalImg = document.querySelector('.uploaded-image');
                    const clonedImg = clonedDoc.querySelector('.uploaded-image');
                    const clonedUploadArea = clonedDoc.querySelector('.upload-area');
                    const placeholder = clonedDoc.querySelector('#uploadPlaceholder');

                    // hide placeholder if visible
                    if (placeholder) placeholder.style.display = 'none';

                    // if no image uploaded, exit
                    if (!originalImg || !clonedImg || !clonedUploadArea) return;

                    // get actual rendered CSS sizing and crop area
                    const rect = originalImg.getBoundingClientRect();
                    const offsetX = originalImg.offsetLeft;
                    const offsetY = originalImg.offsetTop;

                    // convert visible image crop to background image
                    clonedUploadArea.style.backgroundImage = `url('${originalImg.src}')`;
                    clonedUploadArea.style.backgroundSize = 'cover';
                    clonedUploadArea.style.backgroundPosition = 'center';
                    clonedUploadArea.style.backgroundRepeat = 'no-repeat';
                    clonedUploadArea.style.overflow = 'hidden';

                    // remove the <img> so html2canvas cannot resize it
                    clonedImg.remove();
                }


            });

            const link = document.createElement('a');
            link.download = exp.filename;
            link.href = canvas.toDataURL('image/png');
            link.click();

            // Tiny delay between multiple downloads
            if (exports.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 400));
            }
        } catch (error) {
            console.error(`Error exporting ${exp.side}:`, error);
            alert(`Failed to export ${exp.side} side. Please try again.`);
        }
    }

    // Restore original state
    if (wasFlipped) {
        cardInner.classList.add('flipped');
    } else {
        cardInner.classList.remove('flipped');
    }
    cardFront.style.visibility = originalFrontVisibility;
    cardBack.style.visibility = originalBackVisibility;

    if (exports.length > 0) {
        const exportedSides = exports.map(e => e.side).join(' and ');
        alert(`Exported ${exportedSides} side${exports.length > 1 ? 's' : ''}!`);
    }
}

// Check if front side has content
function hasFrontContent() {
    const frontMessage = document.getElementById('frontMessageInput').value.trim();
    const hasImage = document.getElementById('uploadedImage').style.display !== 'none';
    return frontMessage.length > 0 || hasImage;
}

// Check if back side has content
function hasBackContent() {
    const name = document.getElementById('nameInput').value.trim();
    const message = document.getElementById('messageInput').value.trim();
    const hasSignature = !isCanvasBlank(signatureCanvas);
    return name.length > 0 || message.length > 0 || hasSignature;
}

// Check if canvas is blank
function isCanvasBlank(canvas) {
    const ctx = canvas.getContext('2d');
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    // Check if all pixels are transparent
    for (let i = 3; i < pixelData.length; i += 4) {
        if (pixelData[i] !== 0) {
            return false; // Found a non-transparent pixel
        }
    }
    return true;
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);
