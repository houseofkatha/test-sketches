// No imports needed because we loaded THREE in index.html

// --- 1. SETUP SCENE ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
// Scene background is transparent so CSS blue shows through

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 12;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 5, 10);
scene.add(dirLight);

// --- 2. TEXTURE & MESH ---
let currentMesh;
let currentGeometryType = 'plane';
let texture;
let textureLoaded = false;

// FALLBACK IMAGE: A simple gray gradient base64 string.
// This guarantees the object is visible even if local file loading fails.
const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi/P//PwMTAwMDEAAEGAA1AgP+dXK6wQAAAABJRU5ErkJggg==";

const textureLoader = new THREE.TextureLoader();

// Try to load 'default image.jpg', fall back to base64 if it fails
texture = textureLoader.load(
    'default_image.jpg',
    (tex) => {
        console.log("Local image loaded");
        tex.needsUpdate = true;
        textureLoaded = true;
        if (currentMesh && currentMesh.material) {
            currentMesh.material.map = tex;
            currentMesh.material.needsUpdate = true;
        }
    },
    undefined,
    (err) => {
        console.log("Local image failed (CORS or missing), using fallback.");
        // Load the fallback base64 image
        const img = new Image();
        img.src = base64Image;
        img.onload = () => {
            texture.image = img;
            texture.needsUpdate = true;
            textureLoaded = true;
            if (currentMesh && currentMesh.material) {
                currentMesh.material.map = texture;
                currentMesh.material.needsUpdate = true;
            }
        };
    }
);

function createMesh(type) {
    if (currentMesh) {
        scene.remove(currentMesh);
        currentMesh.geometry.dispose();
    }

    let geometry;
    const segments = 64;

    if (type === 'plane') {
        geometry = new THREE.PlaneGeometry(4, 5, segments, segments);
    } else if (type === 'cube') {
        geometry = new THREE.BoxGeometry(3.5, 3.5, 3.5, segments, segments, segments);
    } else if (type === 'sphere') {
        geometry = new THREE.SphereGeometry(2.5, segments, segments);
    }

    const material = new THREE.MeshStandardMaterial({
        map: textureLoaded ? texture : null,
        color: 0xffffff,
        side: THREE.DoubleSide,
        roughness: 0.3,
        metalness: 0.1
    });

    currentMesh = new THREE.Mesh(geometry, material);
    scene.add(currentMesh);
    currentGeometryType = type;
}

createMesh('plane');

console.log("Scene children:", scene.children);
console.log("Current mesh:", currentMesh);
console.log("Camera position:", camera.position);

// --- 2.5 INTERACTION STATE (moved before animation) ---
let isDragging = false;
let isMouseDown = false;
let startMousePos = { x: 0, y: 0 };
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isAutoRotating = true; // Start with auto-rotation enabled

// --- 3. ANIMATION ---
function animate() {
    requestAnimationFrame(animate);

    if (currentMesh && isAutoRotating) {
        const time = Date.now() * 0.001;
        currentMesh.rotation.y = Math.sin(time * 0.5) * 0.5;
        currentMesh.rotation.x = Math.cos(time * 0.3) * 0.3;
    }

    renderer.render(scene, camera);
}
animate();

// --- 4. INTERACTION ---
window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mouseup', onMouseUp);
window.addEventListener('touchstart', (e) => onMouseDown(e.touches[0]));
window.addEventListener('touchmove', (e) => onMouseMove(e.touches[0]));
window.addEventListener('touchend', onMouseUp);

function onMouseDown(e) {
    if (e.target.closest('#remix-menu') || e.target.closest('#remix-btn') || e.target.closest('#upload-trigger') || e.target.closest('#editable-name')) return;

    isMouseDown = true;
    isDragging = false;
    isAutoRotating = false; // Disable auto-rotation on user interaction
    startMousePos = { x: e.clientX, y: e.clientY };

    performDeformation(e.clientX, e.clientY);
}

function onMouseMove(e) {
    if (!isMouseDown || !currentMesh) return;
    const deltaX = e.clientX - startMousePos.x;
    const deltaY = e.clientY - startMousePos.y;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        isDragging = true;
        currentMesh.rotation.y += deltaX * 0.005;
        currentMesh.rotation.x += deltaY * 0.005;
        startMousePos = { x: e.clientX, y: e.clientY };
    }
}

function onMouseUp() {
    isMouseDown = false;
    isDragging = false;
}

function performDeformation(clientX, clientY) {
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(currentMesh);

    if (intersects.length > 0) {
        const point = intersects[0].point;
        currentMesh.worldToLocal(point);
        const posAttr = currentMesh.geometry.attributes.position;
        const vertex = new THREE.Vector3();
        const radius = 1.2;
        const force = -0.5;

        for (let i = 0; i < posAttr.count; i++) {
            vertex.fromBufferAttribute(posAttr, i);
            const dist = vertex.distanceTo(point);
            if (dist < radius) {
                const factor = force * Math.pow(1 - dist / radius, 2);
                if (currentGeometryType === 'plane') vertex.z += factor;
                else vertex.addScaledVector(vertex.clone().normalize(), factor);
                posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
            }
        }
        posAttr.needsUpdate = true;
        currentMesh.geometry.computeVertexNormals();
    }
}

// --- 5. UI LOGIC ---
const remixBtn = document.getElementById('remix-btn');
const remixMenu = document.getElementById('remix-menu');
const closeMenuBtn = document.getElementById('close-menu');
const bgColorPicker = document.getElementById('bg-color-picker');
const txtColorPicker = document.getElementById('text-color-picker');
const shapeBtns = document.querySelectorAll('.shape-buttons button');
const uploadTrigger = document.getElementById('upload-trigger');
const fileInput = document.getElementById('image-upload');
const editableName = document.getElementById('editable-name');

remixBtn.addEventListener('click', () => {
    remixMenu.classList.remove('hidden');
    remixBtn.style.display = 'none';
});

closeMenuBtn.addEventListener('click', () => {
    remixMenu.classList.add('hidden');
    remixBtn.style.display = 'block';
});

bgColorPicker.addEventListener('input', (e) => {
    document.body.style.backgroundColor = e.target.value;
});

txtColorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    document.body.style.color = color;
    editableName.style.borderBottomColor = color;
    closeMenuBtn.style.borderColor = color;
    closeMenuBtn.style.color = color;
});

shapeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        shapeBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        createMesh(e.target.dataset.shape);
        isAutoRotating = true; // Re-enable auto-rotation when shape changes
    });
});

uploadTrigger.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                texture.image = img;
                texture.needsUpdate = true;
                if (currentMesh) currentMesh.material.map = texture;
            }
        };
        reader.readAsDataURL(file);
    }
});

const resetBtn = document.getElementById('reset-btn');
resetBtn.addEventListener('click', () => {
    // Recreate the mesh to reset all deformations
    createMesh(currentGeometryType);
    isAutoRotating = true; // Re-enable auto-rotation on reset
    editableName.textContent = 'BLANK'; // Reset name to default
});

const exportBtn = document.getElementById('export-btn');
exportBtn.addEventListener('click', () => {
    // Hide only the buttons
    const resetBtn = document.getElementById('reset-btn');
    const remixBtn = document.getElementById('remix-btn');
    const remixMenu = document.getElementById('remix-menu');
    const canvasContainer = document.getElementById('canvas-container');

    const originalResetDisplay = resetBtn.style.display;
    const originalExportDisplay = exportBtn.style.display;
    const originalRemixDisplay = remixBtn.style.display;
    const originalMenuDisplay = remixMenu.style.display;

    resetBtn.style.display = 'none';
    exportBtn.style.display = 'none';
    remixBtn.style.display = 'none';
    remixMenu.style.display = 'none';

    // Render the 3D scene
    renderer.render(scene, camera);
    const canvas3D = renderer.domElement;

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = () => {
        // Capture the page without the canvas (so we get text and background)
        canvasContainer.style.display = 'none';

        html2canvas(document.documentElement, {
            backgroundColor: null,
            allowTaint: true,
            useCORS: true,
            scale: 1,
            logging: false
        }).then(canvas2D => {
            // Show canvas again
            canvasContainer.style.display = 'block';

            // Create composite canvas
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = canvas2D.width;
            finalCanvas.height = canvas2D.height;
            const ctx = finalCanvas.getContext('2d');

            // Draw the 2D background and text
            ctx.drawImage(canvas2D, 0, 0);

            // Draw the 3D canvas on top at its actual position
            ctx.drawImage(canvas3D, 0, 0, canvas2D.width, canvas2D.height);

            // Download
            const link = document.createElement('a');
            link.href = finalCanvas.toDataURL();
            link.download = 'sketch.png';
            link.click();

            // Restore buttons
            resetBtn.style.display = originalResetDisplay;
            exportBtn.style.display = originalExportDisplay;
            remixBtn.style.display = originalRemixDisplay;
            remixMenu.style.display = originalMenuDisplay;
        }).catch(err => {
            console.error('Export failed:', err);
            canvasContainer.style.display = 'block';
            // Restore on error
            resetBtn.style.display = originalResetDisplay;
            exportBtn.style.display = originalExportDisplay;
            remixBtn.style.display = originalRemixDisplay;
            remixMenu.style.display = originalMenuDisplay;
        });
    };
    document.head.appendChild(script);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});