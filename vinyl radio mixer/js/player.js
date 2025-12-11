// Modern Vinyl Player with Dynamic Color Theming

// Track Database with Color Themes
const tracks = [
    {
        id: 1,
        title: "APT",
        artist: "Bruno Mars",
        album: "Singles • 2024",
        src: "assets/audio/track1.mp3",
        theme: "track1"
    },
    {
        id: 2,
        title: "Step Into Christmas",
        artist: "Elton John",
        album: "Holiday Classics • 1973",
        src: "assets/audio/track2.mp3",
        theme: "track2"
    },
    {
        id: 3,
        title: "The Fate of Ophelia",
        artist: "Taylor Swift",
        album: "Singles • 2024",
        src: "assets/audio/track3.mp3",
        theme: "track3"
    },
    {
        id: 4,
        title: "Last Christmas",
        artist: "Wham!",
        album: "Holiday Classics • 1984",
        src: "assets/audio/track4.mp3",
        theme: "track4"
    },
    {
        id: 5,
        title: "Dreamy Paths and Guardian Trees",
        artist: "AI Generated",
        album: "Special Edition • 2025",
        src: "assets/audio/ai-remix.mp3",
        theme: "gift",
        isGift: true
    }
];

// Player State
let currentTrackIndex = 0;
let isPlaying = false;
let isRepeat = false;
let generatedTracks = []; // Store dynamically generated tracks

// DOM Elements
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const giftIconBtn = document.getElementById('giftIconBtn');
const giftIconSvg = document.getElementById('giftIconSvg');
const repeatBtn = document.getElementById('repeatBtn');
const giftBtn = document.getElementById('giftBtn');
const playIcon = document.getElementById('playIcon');

const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const trackAlbum = document.getElementById('trackAlbum');

const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressHandle = document.getElementById('progressHandle');

const volumeSlider = document.getElementById('volumeSlider');
const vinylRecord = document.getElementById('vinylRecord');
const playlist = document.getElementById('playlist');

// Initialize Player
function init() {
    loadTrack(currentTrackIndex);
    renderPlaylist();
    setupEventListeners();
    updateVolume();
}

// Setup Event Listeners
function setupEventListeners() {
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPreviousTrack);
    nextBtn.addEventListener('click', playNextTrack);
    giftIconBtn.addEventListener('click', generateInspiredTrack);
    repeatBtn.addEventListener('click', toggleRepeat);
    giftBtn.addEventListener('click', playGiftTrack);

    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('loadedmetadata', updateDuration);
    audioPlayer.addEventListener('ended', handleTrackEnd);
    audioPlayer.addEventListener('error', handleAudioError);

    volumeSlider.addEventListener('input', updateVolume);

    progressContainer.addEventListener('click', seekTrack);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

// Load Track
function loadTrack(index) {
    currentTrackIndex = index;
    const track = tracks[index];

    audioPlayer.src = track.src;
    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    trackAlbum.textContent = track.album;

    // Change theme
    changeTheme(track.theme);

    // Update gift icon color
    updateGiftIconColor();

    // Update playlist UI
    updatePlaylistUI();

    // Load metadata
    audioPlayer.load();
}

// Change Color Theme
function changeTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
}

// Play/Pause Toggle
function togglePlay() {
    if (isPlaying) {
        pause();
    } else {
        play();
    }
}

// Play
function play() {
    audioPlayer.play()
        .then(() => {
            isPlaying = true;
            updatePlayButton(true);
            vinylRecord.classList.add('spinning');
        })
        .catch(error => {
            console.error('Playback error:', error);
        });
}

// Pause
function pause() {
    audioPlayer.pause();
    isPlaying = false;
    updatePlayButton(false);
    vinylRecord.classList.remove('spinning');
}

// Update Play Button
function updatePlayButton(playing) {
    if (playing) {
        playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/>';
    } else {
        playIcon.innerHTML = '<path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>';
    }
}

// Previous Track
function playPreviousTrack() {
    if (audioPlayer.currentTime > 3) {
        audioPlayer.currentTime = 0;
    } else {
        currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
        loadTrack(currentTrackIndex);
        if (isPlaying) play();
    }
}

// Next Track
function playNextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) play();
}

// Play Gift Track
function playGiftTrack() {
    const giftIndex = tracks.findIndex(track => track.isGift);
    if (giftIndex !== -1) {
        loadTrack(giftIndex);
        play();
    }
}

// Generate Inspired Track
function generateInspiredTrack() {
    const currentTrack = tracks[currentTrackIndex];

    // Don't generate inspired track from the AI remix itself
    if (currentTrack.isGift) {
        alert('Cannot create inspired track from AI remix!');
        return;
    }

    // Create inspired track name
    const inspiredTrackName = `${currentTrack.title} inspired song`;

    // Check if this inspired track already exists
    const existingIndex = tracks.findIndex(t => t.title === inspiredTrackName);

    if (existingIndex === -1) {
        // Create new inspired track
        const inspiredTrack = {
            id: tracks.length + 1,
            title: inspiredTrackName,
            artist: "AI Generated",
            album: `Inspired by ${currentTrack.artist} • 2025`,
            src: "assets/audio/ai-remix.mp3", // For now, uses the ai-remix file
            theme: "gift",
            isInspired: true,
            originalTrack: currentTrack.title
        };

        // Add to tracks array
        tracks.push(inspiredTrack);

        // Re-render playlist
        renderPlaylist();

        // Play the new track
        loadTrack(tracks.length - 1);
        play();
    } else {
        // Track already exists, just play it
        loadTrack(existingIndex);
        play();
    }
}

// Update Gift Icon Color
function updateGiftIconColor() {
    const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary-color').trim();
    giftIconBtn.style.color = primaryColor;
    giftIconBtn.style.borderColor = primaryColor;
}

// Toggle Repeat
function toggleRepeat() {
    isRepeat = !isRepeat;
    repeatBtn.style.color = isRepeat ? 'var(--primary-color)' : 'var(--text-primary)';
    repeatBtn.style.borderColor = isRepeat ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.1)';
}

// Handle Track End
function handleTrackEnd() {
    if (isRepeat) {
        audioPlayer.currentTime = 0;
        play();
    } else {
        playNextTrack();
    }
}

// Update Progress
function updateProgress() {
    const currentTime = audioPlayer.currentTime;
    const duration = audioPlayer.duration;

    if (duration > 0) {
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.width = progressPercent + '%';
        progressHandle.style.left = progressPercent + '%';
        currentTimeEl.textContent = formatTime(currentTime);
    }
}

// Update Duration
function updateDuration() {
    const duration = audioPlayer.duration;
    if (duration && !isNaN(duration)) {
        durationEl.textContent = formatTime(duration);
    }
}

// Seek Track
function seekTrack(e) {
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audioPlayer.currentTime = pos * audioPlayer.duration;
}

// Format Time
function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) {
        return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update Volume
function updateVolume() {
    const volume = volumeSlider.value / 100;
    audioPlayer.volume = volume;
}

// Render Playlist
function renderPlaylist() {
    playlist.innerHTML = '';

    tracks.forEach((track, index) => {
        // Skip the AI remix placeholder track (only show inspired tracks)
        if (track.isGift && !track.isInspired) return;

        const li = document.createElement('li');
        li.className = 'track-item';
        if (track.isGift) li.classList.add('gift');
        if (track.isInspired) li.classList.add('inspired');
        if (index === currentTrackIndex) li.classList.add('active');

        li.innerHTML = `
            <div class="track-time">${formatTrackTime(index)}</div>
            <div class="track-playing-icon">
                ${index === currentTrackIndex && isPlaying ?
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' :
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5L19 12L8 19V5Z"/></svg>'}
            </div>
            <div class="track-name-container">
                <div class="track-name">${track.title}</div>
                <div class="track-subtitle">${track.artist}</div>
            </div>
            <div class="track-duration" id="duration-${index}">--:--</div>
        `;

        li.addEventListener('click', () => {
            loadTrack(index);
            play();
        });

        playlist.appendChild(li);
    });
}

// Format Track Time for Playlist
function formatTrackTime(index) {
    const totalSeconds = index * 203; // Mock duration
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update Playlist UI
function updatePlaylistUI() {
    const items = playlist.querySelectorAll('.track-item');
    items.forEach((item, index) => {
        if (index === currentTrackIndex) {
            item.classList.add('active');
            const icon = item.querySelector('.track-playing-icon');
            if (icon) {
                icon.innerHTML = isPlaying ?
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' :
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5L19 12L8 19V5Z"/></svg>';
            }
        } else {
            item.classList.remove('active');
        }
    });
}

// Handle Keyboard Shortcuts
function handleKeyboard(e) {
    switch(e.key) {
        case ' ':
            e.preventDefault();
            togglePlay();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            playPreviousTrack();
            break;
        case 'ArrowRight':
            e.preventDefault();
            playNextTrack();
            break;
        case 'ArrowUp':
            e.preventDefault();
            volumeSlider.value = Math.min(100, parseInt(volumeSlider.value) + 10);
            updateVolume();
            break;
        case 'ArrowDown':
            e.preventDefault();
            volumeSlider.value = Math.max(0, parseInt(volumeSlider.value) - 10);
            updateVolume();
            break;
    }
}

// Handle Audio Error
function handleAudioError(e) {
    console.error('Audio error:', e);
    console.warn(`
        ⚠️ Audio Error: Unable to load ${tracks[currentTrackIndex].title}

        Please ensure:
        1. Audio files are placed in 'assets/audio/' folder
        2. Files are named: track1.mp3, track2.mp3, track3.mp3, track4.mp3, ai-remix.mp3
        3. Files are in supported format (MP3, WAV, OGG)
    `);
}

// Update playlist icons when playing state changes
audioPlayer.addEventListener('play', () => {
    isPlaying = true;
    updatePlaylistUI();
});

audioPlayer.addEventListener('pause', () => {
    isPlaying = false;
    updatePlaylistUI();
});

// ========================================
// REMIX PANEL FUNCTIONALITY
// ========================================

// Remix Panel DOM Elements
const remixBtn = document.getElementById('remixBtn');
const remixPanel = document.getElementById('remixPanel');
const panelOverlay = document.getElementById('panelOverlay');
const closePanelBtn = document.getElementById('closePanelBtn');
const shuffleColorsBtn = document.getElementById('shuffleColorsBtn');
const currentColorsDiv = document.getElementById('currentColors');
const trackLibraryDiv = document.getElementById('trackLibrary');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const uploadedFilesDiv = document.getElementById('uploadedFiles');

// Track Library (10 total tracks - user can select 4)
const trackLibrary = [
    { name: "APT", artist: "Bruno Mars", selected: true },
    { name: "Step Into Christmas", artist: "Elton John", selected: true },
    { name: "The Fate of Ophelia", artist: "Taylor Swift", selected: true },
    { name: "Last Christmas", artist: "Wham!", selected: true },
    { name: "Blinding Lights", artist: "The Weeknd", selected: false },
    { name: "Levitating", artist: "Dua Lipa", selected: false },
    { name: "Watermelon Sugar", artist: "Harry Styles", selected: false },
    { name: "Circles", artist: "Post Malone", selected: false },
    { name: "Don't Start Now", artist: "Dua Lipa", selected: false },
    { name: "Savage Love", artist: "Jawsh 685 & Jason Derulo", selected: false }
];

// Color Palettes for Shuffling
const colorPalettes = [
    ['#FF3366', '#00D9FF', '#9D4EDD', '#FFB800', '#FF006E'],
    ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
    ['#E74C3C', '#3498DB', '#9B59B6', '#F39C12', '#1ABC9C'],
    ['#FF69B4', '#00CED1', '#BA55D3', '#FFD700', '#FF1493'],
    ['#FF4757', '#5F27CD', '#00D2D3', '#FFA502', '#FF6348'],
    ['#FC427B', '#1DD1A1', '#5F27CD', '#FFC312', '#EE5A24'],
    ['#F368E0', '#48DBF B', '#A29BFE', '#FD79A8', '#FDCB6E']
];

let currentPaletteIndex = 0;
let uploadedCustomTracks = [];

// Open/Close Panel
function openRemixPanel() {
    remixPanel.classList.add('active');
    panelOverlay.classList.add('active');
    initializeRemixPanel();
}

function closeRemixPanel() {
    remixPanel.classList.remove('active');
    panelOverlay.classList.remove('active');
}

// Initialize Remix Panel
function initializeRemixPanel() {
    renderCurrentColors();
    renderTrackLibrary();
    renderUploadedFiles();
}

// Render Current Colors
function renderCurrentColors() {
    const colors = [
        { name: 'Track 1', color: getComputedStyle(document.body).getPropertyValue('--primary-color').trim() },
        { name: 'Track 2', color: '#00D9FF' },
        { name: 'Track 3', color: '#9D4EDD' },
        { name: 'Track 4', color: '#FFB800' },
        { name: 'Gift', color: '#FF006E' }
    ];

    // Get actual current colors from CSS
    const track1Color = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();

    currentColorsDiv.innerHTML = '';
    ['track1', 'track2', 'track3', 'track4', 'gift'].forEach((theme, index) => {
        const tempEl = document.createElement('div');
        document.body.setAttribute('data-theme', theme);
        const color = getComputedStyle(document.body).getPropertyValue('--primary-color').trim();

        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.background = color;
        swatch.textContent = `T${index + 1}`;
        currentColorsDiv.appendChild(swatch);
    });

    // Restore current theme
    changeTheme(tracks[currentTrackIndex].theme);
}

// Shuffle Colors
function shuffleColors() {
    currentPaletteIndex = (currentPaletteIndex + 1) % colorPalettes.length;
    const newPalette = colorPalettes[currentPaletteIndex];

    // Update CSS variables for each theme
    const styleSheet = document.styleSheets[0];
    const themes = ['track1', 'track2', 'track3', 'track4', 'gift'];

    themes.forEach((theme, index) => {
        const color = newPalette[index];
        const rgba = hexToRgba(color, 0.4);

        // Find and update the theme rule
        for (let i = 0; i < styleSheet.cssRules.length; i++) {
            const rule = styleSheet.cssRules[i];
            if (rule.selectorText === `body[data-theme="${theme}"]`) {
                rule.style.setProperty('--primary-color', color);
                rule.style.setProperty('--accent-glow', rgba);
                break;
            }
        }
    });

    // Update current colors display
    renderCurrentColors();

    // Update current theme
    changeTheme(tracks[currentTrackIndex].theme);
    updateGiftIconColor();
}

// Helper: Convert hex to rgba
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Render Track Library
function renderTrackLibrary() {
    trackLibraryDiv.innerHTML = '';
    const selectedCount = trackLibrary.filter(t => t.selected).length;

    trackLibrary.forEach((track, index) => {
        const trackEl = document.createElement('div');
        trackEl.className = 'library-track';
        if (track.selected) trackEl.classList.add('selected');
        if (selectedCount >= 4 && !track.selected) trackEl.classList.add('disabled');

        trackEl.innerHTML = `
            <div class="track-checkbox"></div>
            <div class="library-track-info">
                <div class="library-track-name">${track.name}</div>
                <div class="library-track-artist">${track.artist}</div>
            </div>
        `;

        trackEl.addEventListener('click', () => toggleLibraryTrack(index));
        trackLibraryDiv.appendChild(trackEl);
    });

    // Update description
    document.querySelector('.remix-section h3 + .section-description').textContent =
        `Choose 4 tracks from the library (${selectedCount}/4 selected)`;
}

// Toggle Library Track Selection
function toggleLibraryTrack(index) {
    const selectedCount = trackLibrary.filter(t => t.selected).length;

    if (trackLibrary[index].selected) {
        // Deselect
        trackLibrary[index].selected = false;
    } else {
        // Select only if less than 4 selected
        if (selectedCount < 4) {
            trackLibrary[index].selected = true;
        } else {
            alert('You can only select up to 4 tracks!');
            return;
        }
    }

    renderTrackLibrary();
}

// Handle File Upload
function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    const totalFiles = uploadedCustomTracks.length + files.length;

    if (totalFiles > 4) {
        alert(`You can only upload up to 4 files. You're trying to upload ${totalFiles} files.`);
        return;
    }

    files.forEach(file => {
        if (file.type.startsWith('audio/')) {
            uploadedCustomTracks.push({
                name: file.name,
                file: file,
                url: URL.createObjectURL(file)
            });
        }
    });

    renderUploadedFiles();
    fileInput.value = ''; // Reset input
}

// Render Uploaded Files
function renderUploadedFiles() {
    uploadedFilesDiv.innerHTML = '';

    uploadedCustomTracks.forEach((track, index) => {
        const fileEl = document.createElement('div');
        fileEl.className = 'uploaded-file';
        fileEl.innerHTML = `
            <div class="uploaded-file-name">${track.name}</div>
            <button class="remove-file-btn" data-index="${index}">×</button>
        `;

        const removeBtn = fileEl.querySelector('.remove-file-btn');
        removeBtn.addEventListener('click', () => removeUploadedFile(index));

        uploadedFilesDiv.appendChild(fileEl);
    });
}

// Remove Uploaded File
function removeUploadedFile(index) {
    URL.revokeObjectURL(uploadedCustomTracks[index].url);
    uploadedCustomTracks.splice(index, 1);
    renderUploadedFiles();
}

// Event Listeners for Remix Panel
remixBtn.addEventListener('click', openRemixPanel);
closePanelBtn.addEventListener('click', closeRemixPanel);
panelOverlay.addEventListener('click', closeRemixPanel);
shuffleColorsBtn.addEventListener('click', shuffleColors);
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileUpload);

// Initialize on page load
window.addEventListener('DOMContentLoaded', init);

console.log('🎵 Modern Vinyl Player Loaded!');
console.log('🎨 Dynamic color themes enabled');
console.log('📁 Audio files location: assets/audio/');
console.log('🎹 Keyboard shortcuts:');
console.log('   - Space: Play/Pause');
console.log('   - Arrow Left: Previous');
console.log('   - Arrow Right: Next');
console.log('   - Arrow Up/Down: Volume');
