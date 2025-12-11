# 🎵 Modern Vinyl Player

A sleek, modern vinyl record player web app with dynamic color-changing themes that shift as you switch tracks. Features a beautiful UI inspired by contemporary music players with retro vinyl aesthetics.

## ✨ Features

- **🎨 Dynamic Color Themes**: Colors automatically change for each track (Pink → Cyan → Purple → Gold → Hot Pink for gift track)
- **💿 Spinning Vinyl Animation**: Beautiful animated vinyl record that spins when playing
- **🎮 Full Playback Controls**: Play, pause, previous, next, shuffle, and repeat
- **🎁 Gift Button**: Special button that auto-plays your AI remix track
- **📊 Interactive Progress Bar**: Click to seek, visual feedback
- **🔊 Volume Control**: Smooth volume slider
- **⌨️ Keyboard Shortcuts**: Control everything with your keyboard
- **📱 Responsive Design**: Looks amazing on all devices
- **🎯 Track List**: Beautiful "UP NEXT" section with all tracks

## 🎨 Color Themes

Each track has its own unique color scheme:
- **Track 1**: Pink/Magenta (#FF3366)
- **Track 2**: Cyan/Blue (#00D9FF)
- **Track 3**: Purple/Violet (#9D4EDD)
- **Track 4**: Gold/Yellow (#FFB800)
- **AI Remix (Gift)**: Hot Pink (#FF006E)

## 📁 Project Structure

```
vinyl-radio-mixer/
├── index.html              # Main HTML file
├── css/
│   └── style.css          # Modern styling with CSS variables for theming
├── js/
│   └── player.js          # Audio player with dynamic theming
├── assets/
│   └── audio/             # 🎵 PUT YOUR AUDIO FILES HERE!
│       ├── track1.mp3     # Track 1 (Pink theme)
│       ├── track2.mp3     # Track 2 (Cyan theme)
│       ├── track3.mp3     # Track 3 (Purple theme)
│       ├── track4.mp3     # Track 4 (Gold theme)
│       └── ai-remix.mp3   # AI Remix - plays when you click gift button
└── README.md
```

## 🎧 How to Add Your Audio Files

### Step 1: Prepare Your Audio Files

Rename your 5 audio files to match these exact names:
- `track1.mp3` - Your first track (Pink theme)
- `track2.mp3` - Your second track (Cyan theme)
- `track3.mp3` - Your third track (Purple theme)
- `track4.mp3` - Your fourth track (Gold theme)
- `ai-remix.mp3` - Your AI remix (Hot Pink theme - plays via gift button!)

### Step 2: Upload to GitHub

**Option A: GitHub Web Interface (Easiest)**

1. Go to your repo on GitHub
2. Navigate to `assets/audio/` folder
3. Click "Add file" → "Upload files"
4. Drag and drop your 5 renamed audio files
5. Commit: "Add audio tracks"

**Option B: Command Line**

```bash
# Copy your audio files (rename them first!)
cp /path/to/song1.mp3 assets/audio/track1.mp3
cp /path/to/song2.mp3 assets/audio/track2.mp3
cp /path/to/song3.mp3 assets/audio/track3.mp3
cp /path/to/song4.mp3 assets/audio/track4.mp3
cp /path/to/ai-remix-song.mp3 assets/audio/ai-remix.mp3

# Commit and push
git add assets/audio/*.mp3
git commit -m "Add audio tracks"
git push
```

### Step 3: Customize Track Info (Optional)

To update track names, artists, and album info:

1. Open `js/player.js`
2. Find the `tracks` array (lines 4-46)
3. Update the track information:

```javascript
const tracks = [
    {
        id: 1,
        title: "Your Song Title",      // Change this
        artist: "Your Artist Name",     // Change this
        album: "Album Name • 2025",     // Change this
        src: "assets/audio/track1.mp3", // Keep this
        theme: "track1"                 // Keep this
    },
    // ... etc
];
```

## 🚀 How to Use

### Running Locally

**Quick Start:**
```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx http-server -p 8000
```

Then open: `http://localhost:8000`

Or simply open `index.html` directly in your browser!

### Deploy to GitHub Pages

1. Go to repo **Settings** → **Pages**
2. Select your branch as source
3. Your app will be live at: `https://yourusername.github.io/vinyl-radio-mixer/`

## 🎮 Controls

### Mouse Controls
- **Play/Pause**: Toggle playback
- **Previous**: Go to previous track (or restart if > 3 seconds)
- **Next**: Skip to next track
- **Shuffle**: Randomize track order
- **Repeat**: Loop current track
- **Gift Button** 🎁: Instantly play AI remix
- **Progress Bar**: Click to seek
- **Volume Slider**: Adjust volume
- **Track List**: Click any track to play

### Keyboard Shortcuts
- **Space**: Play/Pause
- **Arrow Left**: Previous track
- **Arrow Right**: Next track
- **Arrow Up**: Volume up (+10%)
- **Arrow Down**: Volume down (-10%)

## 🎨 Customization

### Changing Color Themes

Edit the CSS variables in `css/style.css` (lines 20-49):

```css
body[data-theme="track1"] {
    --primary-color: #FF3366;      /* Main color */
    --secondary-color: #FF6B9D;    /* Secondary color */
    --accent-glow: rgba(255, 51, 102, 0.4); /* Glow effect */
}
```

### Adding More Tracks

To add more than 5 tracks:

1. Add audio files to `assets/audio/`
2. Add track info to `tracks` array in `js/player.js`
3. Create a new color theme in `css/style.css`
4. Assign the theme to your track

### Changing Fonts

The app uses **Inter** font. To change:

1. Update the Google Fonts import in `index.html` (line 10)
2. Update `font-family` in `css/style.css` (line 52)

## 🔧 Troubleshooting

### Audio not playing?

1. **Check file names**: Must be exactly `track1.mp3`, `track2.mp3`, etc.
2. **Check file location**: Files must be in `assets/audio/` folder
3. **Check format**: Use MP3 for best compatibility
4. **Check browser console**: Press F12 to see error messages
5. **Try different browser**: Some browsers have stricter audio policies

### Colors not changing?

- The theme changes automatically when you switch tracks
- Check browser console for JavaScript errors
- Try hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)

### Vinyl not spinning?

- Vinyl spins only when audio is playing
- If audio isn't loading, the vinyl won't spin
- Check audio troubleshooting steps above

## 📱 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🎯 Supported Audio Formats

- **MP3** (Recommended - best compatibility)
- WAV
- OGG
- M4A

## 📝 License

Free to use and modify for personal projects!

## 🎉 Enjoy Your Modern Vinyl Experience!

Experience the perfect blend of modern design and retro vinyl aesthetics with dynamic color themes that bring your music to life! 🎵✨
