const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Handle High DPI displays
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    // Force CSS size to match window
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    // Scale all drawing operations by dpr
    ctx.scale(dpr, dpr);

    // Update game positions using LOGICAL pixels (window.innerWidth)
    if (typeof ropeAnchor !== 'undefined') {
        ropeAnchor.x = window.innerWidth / 2;
        // ropeAnchor.y is constant (-200)

        if (typeof pinata !== 'undefined') {
            // Recalculate pinata resting position
            const restingY = window.innerHeight / 2 - 40;
            // logic for string length update
            if (typeof string !== 'undefined') {
                string.length = restingY - ropeAnchor.y;
            }
            // If just resizing, we might want to keep the current angle but shift the pivot
            // But simple reset for now is safer to avoid physics explosions
            // pinata.x = ropeAnchor.x; 
            // pinata.y = restingY;
        }
    }
}

// Initial sizing will be called after variables are defined

let backgroundColor = '#C64DFF';
let epilepsyMode = false;
let epilepsyInterval = null;
let isCanvasTainted = false; // Optimization: detect once and disable swirl permanently if true
let customImage = null;
let backgroundPicker;
let backgroundText;
let cameraStream = null;
let videoElement = null;
let isCameraMode = false;
let damagePoints = []; // Array of {x, y, intensity} hit locations relative to image center (0-1 normalized)
let damagedImageCanvas = null;
let damagedImageDirty = true; // Flag to rebuild damaged image
let cachedDamagedImage = null; // Cached damaged image to avoid recalculating every frame
let lastDamageHash = ''; // Hash of damage points to detect changes
let hitCount = 0;
let isBroken = false;
let breakThreshold = 0; // Will be set randomly between 8-15 on first hit

// load default pinata image (provided by workspace)
const defaultImage = new Image();
// defaultImage.crossOrigin = 'anonymous'; // Removed to allow local file loading
defaultImage.onerror = (e) => {
    console.error('Failed to load default pinata image:', e);
    console.error('Image src:', defaultImage.src);
};
defaultImage.onload = () => {
    console.log('Default pinata image loaded:', defaultImage.width, 'x', defaultImage.height);
};
defaultImage.src = 'default pinata.png';

// image filter applied to the pinata art
const availableFilters = [
    'none',
    'grayscale(0.35)',
    'sepia(0.38)',
    'contrast(1.2) saturate(1.2)',
    'hue-rotate(25deg) saturate(1.1)',
    'brightness(1.06)'
];
let currentPinataFilter = 'none';

// Offscreen canvas for pixel-perfect hit detection
const hitTestCanvas = document.createElement('canvas');
hitTestCanvas.width = 1; hitTestCanvas.height = 1;
const hitTestCtx = hitTestCanvas.getContext('2d', { willReadFrequently: true });

// Store actual drawn dimensions for hit testing match
let lastDrawDimensions = { w: 0, h: 0 };

// Colors used for the piñata stripes
let pinataColors = ['#ffdf00', '#00b3ff', '#ff8a00', '#ff2aa6', '#2b9eff', '#ffde59'];

const emojiSets = {
    candy: ['🍬', '🍭', '🍫', '🍩', '🍪', '🧁'],
    party: ['🎉', '🎊', '🎈', '🎁', '✨', '🎀'],
    fruits: ['🍎', '🍊', '🍋', '🍌', '🍇', '🍓'],
    hearts: ['❤️', '💖', '💕', '💗', '💝', '💘'],
    angry: ['😡', '😠', '😤']
};

let currentEmojiSet = 'angry'; // default set now angry

const ropeAnchor = {
    x: window.innerWidth / 2, // Use logical width
    y: -200 // anchor beyond top of page so top is not visible
};

const pinata = {
    x: ropeAnchor.x,
    y: window.innerHeight / 2 - 40, // Use logical height
    width: 360, // larger pinata image
    height: 240,
    angle: 0,
    angularVelocity: 0,
    angularAcceleration: 0,
    damping: 0.96, // higher damping to make swings decay faster
    gravity: 0.003
};

const string = {
    startY: ropeAnchor.y,
    length: pinata.y - ropeAnchor.y
};

// Initial sizing now that variables exist
resizeCanvas();

const emojis = [];
const MAX_EMOJIS = 18; // tighter cap on emoji particles for better performance
let lastHitTime = 0; // throttle rapid hits

// emoji render cache (offscreen canvases) to avoid re-rendering text each frame
const emojiCache = new Map();
function getEmojiCanvas(emoji, size) {
    // quantize size for cache (reduce unique canvases)
    size = Math.max(12, Math.round(size / 4) * 4);
    const key = `${emoji}|${size}`;
    if (emojiCache.has(key)) return emojiCache.get(key);
    const off = document.createElement('canvas');
    off.width = size;
    off.height = size;
    const offCtx = off.getContext('2d');
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.font = `${Math.round(size * 0.95)}px serif`;
    offCtx.fillText(emoji, size / 2, size / 2);
    emojiCache.set(key, off);
    return off;
}


class Emoji {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8 - 2;
        this.rotation = 0;//Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.06;
        this.gravity = 0.3;
        this.size = 20 + Math.random() * 12; // slightly larger so they're more visible
        this.emoji = emojiSets[currentEmojiSet][Math.floor(Math.random() * emojiSets[currentEmojiSet].length)];
        this.life = 1; // 1 means fully opaque; decays per frame
    }

    update() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        // Only decrease life if it's not set to a very high value (explosion emojis)
        if (this.life < 1000) {
            this.life -= 0.00006; // slower fade so emojis remain visible for longer
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (Math.abs(this.rotation) > 0.001) ctx.rotate(this.rotation);
        ctx.globalAlpha = Math.max(0, this.life);
        const cached = getEmojiCanvas(this.emoji, Math.round(this.size));
        ctx.drawImage(cached, -cached.width / 2, -cached.height / 2);
        ctx.restore();

    }
}

function drawString(pivotX, pivotY) {
    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // draw from anchor point (offscreen or top) to the top of the pinata where it hangs
    ctx.moveTo(ropeAnchor.x, string.startY);
    ctx.lineTo(pivotX, pivotY);
    ctx.stroke();

    // small anchor dot at top - offscreen part, which will be above page (not visible) but keep for completeness
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ropeAnchor.x, string.startY - 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function getDamageHash(damagePoints) {
    // Create a simple hash of damage points to detect changes
    return damagePoints.map(d => `${d.x.toFixed(3)},${d.y.toFixed(3)},${d.intensity.toFixed(2)}`).join('|');
}

function applySwirlToImage(sourceImage, damagePoints) {
    // Swirl effect disabled per user request for smoothness
    return sourceImage;

    const imgWidth = sourceImage.width || sourceImage.videoWidth;
    const imgHeight = sourceImage.height || sourceImage.videoHeight;

    if (!imgWidth || !imgHeight || imgWidth <= 0 || imgHeight <= 0) {
        return sourceImage;
    }

    // Check if we can use cached image
    const currentHash = getDamageHash(damagePoints);
    if (cachedDamagedImage && lastDamageHash === currentHash && !damagedImageDirty) {
        return cachedDamagedImage;
    }

    if (!damagedImageCanvas) {
        damagedImageCanvas = document.createElement('canvas');
    }

    damagedImageCanvas.width = imgWidth;
    damagedImageCanvas.height = imgHeight;
    const dCtx = damagedImageCanvas.getContext('2d');

    dCtx.clearRect(0, 0, damagedImageCanvas.width, damagedImageCanvas.height);
    dCtx.drawImage(sourceImage, 0, 0, imgWidth, imgHeight);

    // Apply swirl effect at each damage point - optimized with pixel skipping
    damagePoints.forEach(damage => {
        // Map normalized coordinates (0-1) to image pixel coordinates
        const hitX = damage.x * imgWidth;
        const hitY = damage.y * imgHeight;
        const intensity = damage.intensity || 1;
        const swirlRadius = 60 + intensity * 25;
        const maxSwirl = intensity * 2.0; // Even stronger rotation

        // Get image data in the swirl area
        const x = Math.max(0, Math.min(imgWidth - 1, Math.floor(hitX - swirlRadius)));
        const y = Math.max(0, Math.min(imgHeight - 1, Math.floor(hitY - swirlRadius)));
        const w = Math.min(swirlRadius * 2, imgWidth - x);
        const h = Math.min(swirlRadius * 2, imgHeight - y);

        if (w > 0 && h > 0) {
            // If we already know it's tainted, skip immediately
            if (isCanvasTainted) return sourceImage;

            let imageData;
            try {
                imageData = dCtx.getImageData(x, y, w, h);
            } catch (e) {
                console.warn('Cannot access image data (tainted). Disabling swirl effect permanently.');
                isCanvasTainted = true;
                return sourceImage;
            }
            const data = imageData.data;
            const tempData = new Uint8ClampedArray(data);

            // Apply swirl distortion - process every 2nd pixel for better performance
            const step = 1; // Can increase to 2 for more performance, but reduces quality
            for (let py = 0; py < h; py += step) {
                for (let px = 0; px < w; px += step) {
                    const localX = px - (hitX - x);
                    const localY = py - (hitY - y);
                    const dist = Math.sqrt(localX * localX + localY * localY);
                    const normalizedDist = dist / swirlRadius;

                    if (normalizedDist < 1) {
                        // Calculate swirl angle - more rotation closer to center
                        const angle = Math.atan2(localY, localX);
                        // Much stronger swirl with less falloff for highly visible effect
                        const swirlAmount = maxSwirl * Math.pow(1 - normalizedDist, 1.0); // Less falloff = stronger effect
                        const newAngle = angle + swirlAmount;

                        // Calculate new position after swirl - stronger inward pull
                        const newDist = dist * (1 - normalizedDist * 0.2); // Even stronger inward pull
                        const newX = hitX - x + Math.cos(newAngle) * newDist;
                        const newY = hitY - y + Math.sin(newAngle) * newDist;

                        const srcX = Math.floor(newX);
                        const srcY = Math.floor(newY);

                        // Clamp to bounds
                        const clampedX = Math.max(0, Math.min(w - 1, srcX));
                        const clampedY = Math.max(0, Math.min(h - 1, srcY));

                        const srcIdx = (clampedY * w + clampedX) * 4;
                        const dstIdx = (py * w + px) * 4;

                        if (srcIdx >= 0 && srcIdx < tempData.length && dstIdx >= 0 && dstIdx < data.length) {
                            data[dstIdx] = tempData[srcIdx];
                            data[dstIdx + 1] = tempData[srcIdx + 1];
                            data[dstIdx + 2] = tempData[srcIdx + 2];
                            data[dstIdx + 3] = tempData[srcIdx + 3];
                        }
                    }
                }
            }

            dCtx.putImageData(imageData, x, y);
        }
    });

    // Cache the result
    cachedDamagedImage = damagedImageCanvas;
    lastDamageHash = currentHash;
    damagedImageDirty = false;

    return damagedImageCanvas;
}

function applySwirlEffect(ctx, imageToDraw, drawW, drawH, damagePoints) {
    if (!damagePoints || damagePoints.length === 0) {
        // No damage, draw normally
        ctx.drawImage(imageToDraw, -drawW / 2, -drawH / 2, drawW, drawH);
        return;
    }

    // For each damage point, apply a swirl effect
    // We'll draw the image multiple times with swirl transforms at each hit location
    damagePoints.forEach((damage, index) => {
        const intensity = damage.intensity || 1;
        const swirlAmount = intensity * 0.3; // Rotation amount in radians
        const swirlRadius = 60 + intensity * 30; // Radius of swirl effect

        // Calculate hit position in image coordinates
        const hitX = (damage.x - 0.5) * drawW;
        const hitY = (damage.y - 0.5) * drawH;

        ctx.save();

        // Translate to hit location
        ctx.translate(hitX, hitY);

        // Apply swirl rotation - more rotation for higher intensity
        ctx.rotate(swirlAmount);

        // Scale slightly based on intensity for more visible effect
        const scale = 1 + intensity * 0.05;
        ctx.scale(scale, scale);

        // Translate back
        ctx.translate(-hitX, -hitY);

        // Draw image with swirl transform
        // Use globalCompositeOperation to blend multiple swirls
        if (index === 0) {
            ctx.globalCompositeOperation = 'source-over';
        } else {
            ctx.globalCompositeOperation = 'multiply';
            ctx.globalAlpha = 0.7;
        }

        ctx.drawImage(imageToDraw, -drawW / 2, -drawH / 2, drawW, drawH);

        ctx.restore();
    });

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
}

function drawPinata(pivotX, pivotY) {
    // Don't draw if broken - just let emojis fly out
    if (isBroken) {
        return;
    }

    ctx.save();
    // apply any selected filter for the pinata art
    ctx.filter = currentPinataFilter || 'none';

    // translate and rotate the pinata image according to pivot and angle
    ctx.translate(pivotX, pivotY);
    ctx.rotate(pinata.angle);

    const bodyW = pinata.width;
    const bodyH = pinata.height;

    // Draw camera preview if in camera mode
    if (isCameraMode && videoElement && videoElement.readyState >= 2) {
        try {
            ctx.save();
            // Shadow removed for performance
            // ctx.shadowColor = 'rgba(0,0,0,0.25)';
            // ctx.shadowBlur = 12;
            // ctx.shadowOffsetY = 8;

            const scaleMul = 1.08;
            const drawW = bodyW * scaleMul;
            const drawH = bodyH * scaleMul;

            // Apply swirl effect to video preview
            let imageToDraw = videoElement;
            if (damagePoints.length > 0) {
                imageToDraw = applySwirlToImage(videoElement, damagePoints);
                if (!imageToDraw) imageToDraw = videoElement;
            }

            // Flip video preview horizontally (mirror it)
            ctx.scale(-1, 1);
            ctx.drawImage(imageToDraw, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();
        } catch (e) {
            // ignore if video draw fails
        }

        ctx.filter = 'none';
        ctx.restore();
        return;
    }

    // Only draw the provided image (default or custom). We avoid drawing the geometric shapes when an image is present.
    const imageToDraw = customImage || defaultImage;
    if (imageToDraw) {
        try {
            // Check if image has loaded (has dimensions)
            const imgWidth = imageToDraw.width || imageToDraw.videoWidth || imageToDraw.naturalWidth || 0;
            const imgHeight = imageToDraw.height || imageToDraw.videoHeight || imageToDraw.naturalHeight || 0;

            // Always try to draw - browser will handle if image isn't ready
            ctx.save();
            // Shadow removed for performance
            // ctx.shadowColor = 'rgba(0,0,0,0.25)';
            // ctx.shadowBlur = 12;
            // ctx.shadowOffsetY = 8;

            // slightly scale up the limit box so it appears larger than before
            const scaleMul = 1.08;
            let drawW = bodyW * scaleMul;
            let drawH = bodyH * scaleMul;

            // Aspect Ratio Fix: If using a custom image, scale it to FIT/CONTAIN within the box
            // effectively ignoring the stretch and maintaining proportions.
            // Aspect Ratio Fix: If using a custom image, scale it to FIT/CONTAIN within the box
            // effectively ignoring the stretch and maintaining proportions.
            if (imageToDraw === customImage && imgWidth > 0 && imgHeight > 0) {
                const scale = Math.min(drawW / imgWidth, drawH / imgHeight);
                drawW = imgWidth * scale;
                drawH = imgHeight * scale;
            }

            lastDrawDimensions = { w: drawW, h: drawH };

            // Apply swirl effect if there are damage points
            let imageToRender = imageToDraw;
            if (damagePoints.length > 0 && imgWidth > 0 && imgHeight > 0) {
                imageToRender = applySwirlToImage(imageToDraw, damagePoints);
                if (!imageToRender) imageToRender = imageToDraw;
            }

            // Draw the image - this will work even if image is still loading
            ctx.drawImage(imageToRender, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();
        } catch (e) {
            console.error('Error drawing pinata image:', e);
            console.error('Image object:', imageToDraw);
            console.error('Image src:', imageToDraw.src);
            console.error('Image complete:', imageToDraw.complete);
            console.error('Image dimensions:', imageToDraw.width, 'x', imageToDraw.height);
            // ignore if image draw fails
        }

        // reset filter and restore
        ctx.filter = 'none';
        ctx.restore();
        return;
    }

    // If no image, fallback to drawing geometric version (kept minimal)
    // ... (the rest of the geometric code omitted for brevity as we use an image in the file)
    ctx.restore();
}

function animate() {
    if (epilepsyMode) {
        // Background changes handled by interval
    }
    document.body.style.backgroundColor = backgroundColor;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Compute pivot (top-of-pinata hook) based on current angle and string length
    const pivotX = ropeAnchor.x + Math.sin(pinata.angle) * string.length;
    const pivotY = ropeAnchor.y + Math.cos(pinata.angle) * string.length;

    // Physics - apply pendulum physics with adjustable pendulum factor (skip if in camera mode)
    if (!isCameraMode) {
        const pendulumFactor = 0.02 * (260 / Math.max(80, string.length));
        pinata.angularAcceleration = -pendulumFactor * Math.sin(pinata.angle);
        pinata.angularVelocity += pinata.angularAcceleration;

        // apply damping and cap the angular velocity to avoid uncontrolled spinning
        pinata.angularVelocity *= pinata.damping;
        const maxAV = 0.25;
        if (Math.abs(pinata.angularVelocity) > maxAV) {
            pinata.angularVelocity = Math.sign(pinata.angularVelocity) * maxAV;
        }

        // Apply the resulting angle
        pinata.angle += pinata.angularVelocity;
    } else {
        // Keep pinata still during camera mode
        pinata.angle = 0;
        pinata.angularVelocity = 0;
        pinata.angularAcceleration = 0;
    }

    // Draw rope and pinata using computed pivot
    drawString(pivotX, pivotY);
    drawPinata(pivotX, pivotY);

    for (let i = emojis.length - 1; i >= 0; i--) {
        emojis[i].update();
        emojis[i].draw();
        // Don't remove explosion emojis (life > 1000) - let them stay forever
        // Only remove regular emojis that have faded or gone off screen
        if (emojis[i].life < 1000 && (emojis[i].life <= 0 || emojis[i].y > canvas.height + 100)) {
            emojis.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // compute pivot based on current angle (where rope attaches)
    const pivotX = ropeAnchor.x + Math.sin(pinata.angle) * string.length;
    const pivotY = ropeAnchor.y + Math.cos(pinata.angle) * string.length;

    // distance to the area beneath the pivot (approx center of body)
    const bodyCenterX = pivotX + Math.sin(pinata.angle) * (pinata.height / 2);
    const bodyCenterY = pivotY + Math.cos(pinata.angle) * (pinata.height / 2);
    const dist = Math.sqrt((x - bodyCenterX) ** 2 + (y - bodyCenterY) ** 2);

    if (dist < pinata.width / 2 + 60 && !isBroken) {
        const now = performance.now();
        // ignore hits that occur too close together (120ms) to avoid spamming
        // BUT only if the last hit was actually successful. We check time validation here,
        // but update lastHitTime only after confirming it wasn't a transparency miss.
        if (now - lastHitTime < 120) return;

        // Calculate hit location relative to pinata center (normalized 0-1)
        // Use the EXACT dimensions that were last drawn
        const drawW = lastDrawDimensions.w || (pinata.width * 1.08);
        const drawH = lastDrawDimensions.h || (pinata.height * 1.08);

        // Transform click position to pinata's local coordinate system
        // First, get the click position relative to the pivot (where image is drawn from)
        const dx = x - pivotX;
        const dy = y - pivotY;

        // Rotate click point back by negative pinata angle to get local coordinates
        const cosAngle = Math.cos(-pinata.angle);
        const sinAngle = Math.sin(-pinata.angle);
        const localX = dx * cosAngle - dy * sinAngle;
        const localY = dx * sinAngle + dy * cosAngle;

        // The image is drawn at (-drawW/2, -drawH/2) in local coords, so center is at (0, 0)
        // Map from local coords to normalized 0-1 range
        // localX ranges from -drawW/2 to +drawW/2, we want 0 to 1
        const normalizedX = 0.5 + (localX / drawW);
        const normalizedY = 0.5 + (localY / drawH);


        // Check if hit is within image bounds
        if (normalizedX >= 0 && normalizedX <= 1 && normalizedY >= 0 && normalizedY <= 1) {

            // PIXEL-PERFECT HIT DETECTION (Transparency Check)
            const imageToCheck = customImage || defaultImage;
            if (imageToCheck) {
                // Map normalized coords to source image pixel coords
                const imgW = imageToCheck.width || imageToCheck.videoWidth || 0;
                const imgH = imageToCheck.height || imageToCheck.videoHeight || 0;

                if (imgW > 0 && imgH > 0) {
                    const srcX = Math.floor(normalizedX * imgW);
                    const srcY = Math.floor(normalizedY * imgH);

                    // Draw single pixel to offscreen canvas
                    try {
                        hitTestCtx.clearRect(0, 0, 1, 1);
                        hitTestCtx.drawImage(imageToCheck, srcX, srcY, 1, 1, 0, 0, 1, 1);
                        const pixelData = hitTestCtx.getImageData(0, 0, 1, 1).data;
                        const alpha = pixelData[3];

                        // If pixel is transparent (low alpha), ignore the hit completely
                        if (alpha < 10) return;
                    } catch (e) {
                        // If security error (local file/tainted canvas), we can't check alpha.
                        // Fallback: Assume it's a hit (don't return) so the game is playable.
                        // Only log once to avoid spam
                        if (!window.hasLoggedHitError) {
                            console.warn('Cannot perform pixel-perfect hit check (tainted canvas). Falling back to bounding box.');
                            window.hasLoggedHitError = true;
                        }
                    }
                }
            }

            // TRIGGER ACTION OVERLAY
            const actionOverlay = document.getElementById('actionOverlay');
            if (actionOverlay) {
                actionOverlay.classList.remove('active');
                void actionOverlay.offsetWidth; // force reflow to restart animation/transition
                actionOverlay.classList.add('active');

                // Remove class after short delay to start fade out (handled by CSS transition)
                setTimeout(() => {
                    actionOverlay.classList.remove('active');
                }, 100);
            }

            // If we made it here, it's a valid hit!

            // NOW update the debounce time, so we only throttle ACTUAL hits, 
            // not clicks on transparent areas.
            lastHitTime = now;

            // Check if there's already a damage point nearby (within 0.15 units)
            let foundNearby = false;
            for (let i = 0; i < damagePoints.length; i++) {
                const dx = damagePoints[i].x - normalizedX;
                const dy = damagePoints[i].y - normalizedY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 0.15) {
                    // Increase intensity of existing damage point - more aggressive accumulation
                    damagePoints[i].intensity = Math.min(5, (damagePoints[i].intensity || 1) + 0.5);
                    foundNearby = true;
                    break;
                }
            }

            // Add new damage point if not near existing one
            if (!foundNearby) {
                damagePoints.push({
                    x: normalizedX,
                    y: normalizedY,
                    intensity: 1
                });
            } else {
            }

            damagedImageDirty = true;
            cachedDamagedImage = null; // Invalidate cache
            cachedDamagedImage = null; // Invalidate cache
        }

        // Set break threshold on first hit (random between 8-15)
        if (breakThreshold === 0) {
            breakThreshold = 8 + Math.floor(Math.random() * 8); // 8-15
        }

        // Increment hit count
        hitCount++;

        // Check if pinata should break
        if (hitCount >= breakThreshold && !isBroken) {
            isBroken = true;
            triggerExplosion(bodyCenterX, bodyCenterY);
            return;
        }

        const direction = x < pivotX ? -1 : 1;
        // apply a small angular impulse in the opposite direction of the hit
        const smallImpulse = 0.045; // slightly smaller impulse to reduce movement further
        pinata.angularVelocity = -direction * smallImpulse;

        // reduce emoji spawn when nearing cap, so we don't exceed MAX_EMOJIS
        const baseSpawn = 5; // spawn a few more emojis per hit to improve visibility
        const availableSlots = Math.max(0, MAX_EMOJIS - emojis.length);
        const spawnCount = Math.max(0, Math.min(baseSpawn, availableSlots));
        for (let i = 0; i < spawnCount; i++) {
            emojis.push(new Emoji(bodyCenterX + (Math.random() - 0.5) * 60, bodyCenterY + (Math.random() - 0.5) * 40));
        }

        spawnHitEffect(x, y);
    }
});

function spawnHitEffect(x, y) {
    const effect = document.createElement('img');
    // Randomly choose between boom and pow
    const type = Math.random() < 0.5 ? 'boom.png' : 'pow.png';
    effect.src = `bubbles/${type}`;

    // Calculate offset to ensure it doesn't spawn directly on the cursor
    // Spawn at a random angle on the TOP side (PI to 2PI)
    const angle = Math.PI + Math.random() * Math.PI;
    const distance = 80 + Math.random() * 40; // Offset to clear the bat
    const offX = Math.cos(angle) * distance;
    const offY = Math.sin(angle) * distance;

    // Style the effect
    effect.style.position = 'absolute';
    effect.style.left = (x + offX) + 'px';
    effect.style.top = (y + offY) + 'px';
    effect.style.width = '110px'; // Bigger size
    effect.style.transform = 'translate(-50%, -50%)';
    effect.style.pointerEvents = 'none';
    effect.style.zIndex = '10001'; // Above everything
    effect.style.transition = 'opacity 0.2s ease-in';

    document.body.appendChild(effect);

    // Remove after 1 second
    setTimeout(() => {
        if (effect.parentNode) {
            effect.style.opacity = '0';
            // Wait for fade out
            setTimeout(() => effect.remove(), 200);
        }
    }, 800); // Start fade slightly before 1s
}

function triggerExplosion(x, y) {
    // Create a MASSIVE emoji explosion - 500 emojis bursting from center!
    const explosionCount = 500; // 500 emojis for a huge burst
    const emojiSet = emojiSets[currentEmojiSet];

    for (let i = 0; i < explosionCount; i++) {
        const angle = (Math.PI * 2 * i) / explosionCount + (Math.random() - 0.5) * 1.2;
        const speed = 4 + Math.random() * 14;
        const emoji = new Emoji(x, y);
        emoji.vx = Math.cos(angle) * speed;
        emoji.vy = Math.sin(angle) * speed - 2;
        emoji.size = 20 + Math.random() * 25; // Varied sizes for explosion
        emoji.emoji = emojiSet[Math.floor(Math.random() * emojiSet.length)];
        emoji.life = 999999; // Never disappear - keep them visible forever
        emojis.push(emoji);
    }
}

// UI hooks
const remixBtn = document.getElementById('remixBtn');
const resetBtn = document.getElementById('resetBtn');
const remixMenu = document.getElementById('remixMenu');
const cameraBtn = document.getElementById('cameraBtn');
const uploadBtn = document.getElementById('uploadBtn');
const imageInput = document.getElementById('imageInput');
const captureBtn = document.getElementById('captureBtn');
const epilepsyBtn = document.getElementById('epilepsyBtn');
const randomColorBtn = document.getElementById('randomColorBtn');
backgroundPicker = document.getElementById('backgroundColorPicker');
backgroundText = document.getElementById('backgroundColorText');

remixBtn.addEventListener('click', () => remixMenu.classList.toggle('active'));
resetBtn.addEventListener('click', () => {
    pinata.angle = 0;
    pinata.angularVelocity = 0;
    pinata.angularAcceleration = 0;
    emojis.length = 0;
    emojis.length = 0;
    backgroundColor = '#C64DFF';
    if (epilepsyInterval) { clearInterval(epilepsyInterval); epilepsyInterval = null; }
    epilepsyMode = false;
    customImage = null;
    currentPinataFilter = 'none';
    currentEmojiSet = 'angry';
    document.getElementById('angry').checked = true;
    pinataColors = ['#ffdf00', '#00b3ff', '#ff8a00', '#ff2aa6', '#2b9eff', '#ffde59'];
    updateBackground('#C64DFF');
    stopCamera();
    captureBtn.style.display = 'none';
    // Reset damage
    damagePoints = [];
    damagedImageDirty = true;
    cachedDamagedImage = null;
    lastDamageHash = '';
    hitCount = 0;
    isBroken = false;
    breakThreshold = 0;
});

// Upload image from device
// Upload image from device
uploadBtn.addEventListener('click', () => {
    imageInput.value = ''; // Clear previous value so same file triggers change again
    imageInput.click();
});
imageInput.addEventListener('change', (ev) => {
    const file = ev.target.files[0];
    if (file) {
        loadImageFromFile(file);
        stopCamera(); // Stop camera if it's running
    }
});

// Start camera preview mode
cameraBtn.addEventListener('click', async () => {
    try {
        await startCamera();
        captureBtn.style.display = 'block';
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Unable to access camera. Please check permissions.');
    }
});

// Capture photo from camera
captureBtn.addEventListener('click', () => {
    if (videoElement && videoElement.readyState >= 2) {
        capturePhoto();
    }
});

function startCamera() {
    return new Promise(async (resolve, reject) => {
        // Stop existing camera if running
        stopCamera();

        try {
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment' // Use back camera on mobile
                }
            });

            cameraStream = stream;
            isCameraMode = true;

            // Reset pinata position for stable camera view
            pinata.angle = 0;
            pinata.angularVelocity = 0;
            pinata.angularAcceleration = 0;

            // Create video element if it doesn't exist
            if (!videoElement) {
                videoElement = document.createElement('video');
                videoElement.autoplay = true;
                videoElement.playsInline = true;
                videoElement.style.display = 'none';
                document.body.appendChild(videoElement);
            }

            videoElement.srcObject = stream;

            videoElement.onloadedmetadata = () => {
                videoElement.play();
                resolve();
            };

            videoElement.onerror = reject;
        } catch (error) {
            reject(error);
        }
    });
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    if (videoElement) {
        videoElement.srcObject = null;
    }
    isCameraMode = false;
    // Ensure capture button is hidden when camera stops
    if (captureBtn) captureBtn.style.display = 'none';
}

function capturePhoto() {
    if (!videoElement || !videoElement.readyState) return;

    // Create a canvas to capture the current video frame
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = videoElement.videoWidth;
    captureCanvas.height = videoElement.videoHeight;
    const captureCtx = captureCanvas.getContext('2d');

    // Flip the image horizontally (mirror it)
    captureCtx.translate(captureCanvas.width, 0);
    captureCtx.scale(-1, 1);
    captureCtx.drawImage(videoElement, 0, 0);

    // Convert to image and set as custom image
    captureCanvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                customImage = img;
                stopCamera(); // Stop camera after capture
                isCameraMode = false;
                captureBtn.style.display = 'none';
                // Clear damage when new image is captured
                damagePoints = [];
                damagedImageDirty = true;
                cachedDamagedImage = null;
                lastDamageHash = '';
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(blob);
    }, 'image/png');
}

function loadImageFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            customImage = img;
            // Clear damage when new image is loaded
            damagePoints = [];
            damagedImageDirty = true;
            cachedDamagedImage = null;
            lastDamageHash = '';
            cachedDamagedImage = null; // Invalidate cache
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function updateBackground(color) {
    if (!color) return;
    backgroundColor = color;
    if (backgroundPicker) backgroundPicker.value = color;
    if (backgroundText) backgroundText.value = color.toUpperCase();
    if (epilepsyInterval) { clearInterval(epilepsyInterval); epilepsyInterval = null; }
    epilepsyMode = false;
}

// Background picker inputs
backgroundPicker.addEventListener('input', (e) => updateBackground(e.target.value));
backgroundText.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    // enforce leading #
    const normalized = val.startsWith('#') ? val : `#${val}`;
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized)) {
        updateBackground(normalized);
    }
});

epilepsyBtn.addEventListener('click', () => {
    epilepsyMode = !epilepsyMode;
    if (epilepsyMode) {
        const colors = ['#ff6b9d', '#ffa502', '#4834d4', '#55efc4', '#fd79a8', '#74b9ff'];
        epilepsyInterval = setInterval(() => {
            const newColor = colors[Math.floor(Math.random() * colors.length)];
            backgroundColor = newColor;
            // Directly update inputs without triggering the full updateBackground (which stops epilepsy)
            if (backgroundPicker) backgroundPicker.value = newColor;
            if (backgroundText) backgroundText.value = newColor.toUpperCase();
        }, 450);
    } else {
        if (epilepsyInterval) { clearInterval(epilepsyInterval); epilepsyInterval = null; }
    }
});



randomColorBtn.addEventListener('click', () => {
    const allColors = ['#ffdf00', '#ff6b9d', '#c44569', '#ffa502', '#ff6348', '#4834d4', '#55efc4', '#fd79a8', '#fdcb6e', '#e17055', '#74b9ff', '#a29bfe', '#fab1a0'];
    pinataColors = [];
    for (let i = 0; i < 6; i++) pinataColors.push(allColors[Math.floor(Math.random() * allColors.length)]);
    // Also randomly pick a filter to apply to the pinata
    currentPinataFilter = availableFilters[Math.floor(Math.random() * availableFilters.length)];
    // Randomise the background too for quick variety
    updateBackground(allColors[Math.floor(Math.random() * allColors.length)]);
});

/* Custom Cursor Logic */
const customCursor = document.getElementById('customCursor');

// Preload swing image for smooth switch
const swungImage = new Image();
swungImage.src = 'bat swung.svg';

document.addEventListener('mousemove', (e) => {
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
});

document.addEventListener('mousedown', () => {
    customCursor.src = 'bat swung.svg';
    // Center key point only, no rotation
    customCursor.style.transform = 'translate(-50%, -50%)';
});

document.addEventListener('mouseup', () => {
    customCursor.src = 'bat.svg';
    customCursor.style.transform = 'translate(-50%, -50%)';
});

// Optimization: Ensure cursor is visible when entering window
document.addEventListener('mouseenter', () => {
    customCursor.style.display = 'block';
});

// Hide custom cursor when hovering over the remix menu (so normal cursor can be seen)
remixMenu.addEventListener('mouseenter', () => {
    customCursor.style.display = 'none';
});
remixMenu.addEventListener('mouseleave', () => {
    customCursor.style.display = 'block';
});

document.addEventListener('mouseleave', () => {
    customCursor.style.display = 'none';
});



// Emoji radio
document.querySelectorAll('input[name="emoji"]').forEach(radio => {
    radio.addEventListener('change', (e) => currentEmojiSet = e.target.value);
});

// Make entire emoji row clickable
document.querySelectorAll('.emoji-option').forEach(option => {
    option.addEventListener('click', () => {
        const radio = option.querySelector('input[type="radio"]');
        if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
});

// initialize background controls to current color
updateBackground(backgroundColor);

window.addEventListener('resize', () => {
    resizeCanvas();
    // Reset pinata state on resize to prevent getting stuck
    pinata.x = ropeAnchor.x;
    pinata.y = window.innerHeight / 2 - 40;
    pinata.angle = 0;
    pinata.angularVelocity = 0;
});

// Start animation
animate();

// Hide custom cursor when hovering over interactive elements
const interactiveElements = document.querySelectorAll('button, label, input, #remixMenu');
interactiveElements.forEach(el => {
    // If element is inside the remix menu (and isn't the menu itself), 
    // skip it because the menu container handles the cursor for the whole area.
    if (el.closest('#remixMenu') && el.id !== 'remixMenu') return;

    el.addEventListener('mouseenter', () => {
        customCursor.style.display = 'none';
    });
    el.addEventListener('mouseleave', () => {
        customCursor.style.display = 'block';
    });
});
