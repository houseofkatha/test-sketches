let video;
let customText = "HI";
let customFont = "Georgia";

// 🎨 THEMES (UPDATED: Dusty Rose + Hyperpop Chaos)
let themes = {
  mono:     { bg: [0],                text: [255] },
  dusty:    { bg: [233, 221, 214],    text: [120, 87, 98] },         // Dusty Rose
  neon:     { bg: [10, 10, 30],       text: [0, 255, 200] },
  paper:    { bg: [255],              text: [0] },

  retro:    { bg: [255, 235, 0],      text: [0, 70, 255] },
  synth:    { bg: [255, 60, 180],     text: [255, 255, 60] },
  cyber:    { bg: [10, 30, 10],       text: [0, 255, 70] },
  hyperpop: { bg: [255, 0, 110],      text: [0, 255, 170] }          // Hyperpop Chaos
};

// default theme
let currentTheme = "mono";

function setup() {
  createCanvas(windowWidth, windowHeight);

  video = createCapture(VIDEO);
  video.size(width + 50, height + 50);
  video.hide();

  createUI();
}

function draw() {
  background(...themes[currentTheme].bg);

  let gridsize = int(map(mouseX, 0, width, 15, 60));
  video.loadPixels();

  fill(...themes[currentTheme].text);
  textFont(customFont);

  for (let y = 0; y < video.height; y += gridsize) {
    for (let x = 0; x < video.width; x += gridsize) {
      let index = (y * video.width + x) * 4;
      let r = video.pixels[index];
      let dia = map(r, 0, 255, gridsize, 2);

      textSize(dia);
      text(customText, x, y);
    }
  }
}

function createUI() {
  const ui = document.getElementById("ui");

  // Container for buttons to stack vertically
  const buttonContainer = document.createElement("div");
  buttonContainer.id = "buttonContainer";
  buttonContainer.style.display = "flex";
  buttonContainer.style.flexDirection = "column";
  buttonContainer.style.gap = "8px"; // space between buttons
  ui.appendChild(buttonContainer);

  // 1️⃣ Remix button
  const remixBtn = document.createElement("button");
  remixBtn.id = "remixBtn";
  remixBtn.textContent = "Remix";
  buttonContainer.appendChild(remixBtn);

  // 2️⃣ Download button below Remix
  const downloadBtn = document.createElement("button");
  downloadBtn.id = "downloadBtn";
  downloadBtn.textContent = "Download";
  buttonContainer.appendChild(downloadBtn);

  // Save canvas on click
  downloadBtn.onclick = () => {
    saveCanvas('remix_snapshot', 'png');
  };

  // Panel
  const panel = document.createElement("div");
  panel.id = "panel";
  panel.innerHTML = `
    <label>Text:</label>
    <input type="text" id="textInput" value="${customText}">

    <label>Font:</label>
    <select id="fontSelect">
      <option>Georgia</option>
      <option>Trebuchet MS</option>
      <option>Impact</option>
      <option>Comic Sans MS</option>
      <option>Courier New</option>
      <option>Mukta</option>
    </select>

    <label>Colour Theme:</label>
    <div id="themeGrid">
      ${generateThemeSwatches()}
    </div>

    <button id="resetBtn">Reset</button>
    <button id="closeBtn">Close</button>
  `;
  ui.appendChild(panel);

  // Event listeners
  remixBtn.onclick = () => {
    panel.style.display = panel.style.display === "block" ? "none" : "block";
  };
  document.getElementById("closeBtn").onclick = () => {
    panel.style.display = "none";
  };
  document.getElementById("textInput").oninput = (e) => {
    customText = e.target.value || " ";
  };
  document.getElementById("fontSelect").onchange = (e) => {
    customFont = e.target.value;
  };
  document.querySelectorAll(".themeOption").forEach(opt => {
    opt.onclick = () => {
      currentTheme = opt.dataset.theme;
      updateSwatchSelection(opt.dataset.theme);
    };
  });
  document.getElementById("resetBtn").onclick = () => {
    customText = "HI";
    customFont = "Georgia";
    currentTheme = "mono";

    document.getElementById("textInput").value = "HI";
    document.getElementById("fontSelect").value = "Georgia";
    updateSwatchSelection("mono");
  };
}


function generateThemeSwatches() {
  return Object.keys(themes).map(key => {
    let t = themes[key];
    let bg = `rgb(${t.bg.join(",")})`;
    let txt = `rgb(${t.text.join(",")})`;

    return `
      <div class="themeOption" data-theme="${key}">
        <div class="swatchBG" style="background:${bg}"></div>
        <div class="swatchText" style="background:${txt}"></div>
        <span>${formatThemeName(key)}</span>
      </div>
    `;
  }).join("");
}

function formatThemeName(key) {
  const names = {
    mono: "Mono Noir",
    dusty: "Dusty Rose",
    neon: "Neon Pulse",
    paper: "Paper White",
    retro: "Retro Pop",
    synth: "Synthwave Sunset",
    cyber: "Cyber Green",
    hyperpop: "Hyperpop Chaos"
  };
  return names[key];
}

function updateSwatchSelection(activeKey) {
  document.querySelectorAll(".themeOption").forEach(el => {
    el.classList.toggle("selectedTheme", el.dataset.theme === activeKey);
  });
}


