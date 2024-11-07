const MaxLineSegments = 40000;

const lineColor = 0xffffff06; // this is rgba(255, 255, 255, 0.06)
const PI_2 = Math.PI * 2;

function f(x) {
  return x/(6) + Math.sin(x*25);
}

const canvas = document.querySelector('canvas');
const sceneWidth = canvas.width = window.innerWidth;
const sceneHeight = canvas.height = window.innerHeight;
const {createScene, LineStripCollection} = wgl;

let functionDimensions, scaleX, scaleY;
let lines;
let analyser = null;
let audio = null;
let isPlaying = false;
let frequencyData = null;

function onClick() {
  if (analyser !== null) {
    return;
  }

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  frequencyData = new Uint8Array(analyser.frequencyBinCount);

  const audio = document.querySelector('#audio');
  const audioSource = audioContext.createMediaElementSource(audio);
  audioSource.connect(analyser);
  analyser.connect(audioContext.destination);

  audio.play();
  isPlaying = true;
}

window.addEventListener('click', onClick);


let scene = createScene(canvas);
scene.setClearColor(0x1b/0xff, 0x29/0xff, 0x4a/0xff, 1.)


// Lets bring the grid into the view:
scene.setViewBox({
  left: 0,
  top: 1024,
  right: 1024,
  bottom: 0 
})

renderFunction(f, 0, 0, 1024, 1024);
requestAnimationFrame(renderScene);
document.querySelector('.loader').style.display = 'none';

function renderScene() {
  requestAnimationFrame(renderScene);
  if (analyser) {
    analyser.getByteFrequencyData(frequencyData);
    updateVisualization(frequencyData);
  }
}

function updateVisualization(frequencyData) {
  const scale = 1 + frequencyData[0] / 256;
  let prevPoint = {x: 0, y: 0};
  for (let i = 0; i < MaxLineSegments; i++) {
    prevPoint = getNextPoint(f, prevPoint, i);
    const canvasX = (prevPoint.x - functionDimensions.minX) * scaleX;
    const canvasY = (prevPoint.y - functionDimensions.minY) * scaleY;

    // const freqIndex = i % frequencyData.length; 
    const freqIndex = Math.floor((i / MaxLineSegments) * frequencyData.length);
    const dynamicAlpha = 0x06 + ((frequencyData[freqIndex] / 256) * 0x20);
    const offset = lines.itemsPerLine * i;
    lines.positions[offset] = canvasX;
    lines.positions[offset + 1] = canvasY;
    lines.positions[offset + 2] = 21 * dynamicAlpha;
    let r = 0xff;// Math.round(0xFF * dynamicAlpha);
    lines.colors[offset + 3] = (0x00ffff00 | Math.round(dynamicAlpha)) | (r << 24);

    const freqValue = frequencyData[freqIndex];
    const hue = 160 + (freqValue / 256) * 150; // Hue between 0 and 360
    const rgbColor = hslToRgb(hue / 360, 1, 0.5); // Convert HSL to RGB
    const colorInt = (Math.round(rgbColor.r * 255) << 24) |
                    (Math.round(rgbColor.g * 255) << 16) |
                    (Math.round(rgbColor.b * 255) << 8) |
                    Math.round(dynamicAlpha);
    lines.colors[offset + 3] = colorInt;
  }
  scene.renderFrame();
}

function renderFunction(f, startX, startY, endX, endY) {
  functionDimensions = measureFunction(f, MaxLineSegments); 
  scaleX = (endX - startX) / (functionDimensions.maxX - functionDimensions.minX);
  scaleY = (endY - startY) / (functionDimensions.maxY - functionDimensions.minY);

  lines = new LineStripCollection(MaxLineSegments);
  let prevPoint = {x: 0, y: 0};
  for (let i = 0; i < MaxLineSegments; i++) {
    prevPoint = getNextPoint(f, prevPoint, i);
    const canvasX = (prevPoint.x - functionDimensions.minX) * scaleX + startX;
    const canvasY = (prevPoint.y - functionDimensions.minY) * scaleY + startY;

    lines.add({
      x: canvasX, 
      y: canvasY, 
      z: 0,
      color: lineColor
    });
  }

  scene.appendChild(lines);
}

function getNextPoint(f, prevPoint, n) {
  const phi = f(n) * PI_2;
  return {
    x: prevPoint.x + Math.cos(phi), 
    y: prevPoint.y + Math.sin(phi)
  }
}

function measureFunction(f, max) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let prevPoint = {x: 0, y: 0}
  for (let i = 0; i < max; i++) {
    prevPoint = getNextPoint(f, prevPoint, i);
    minX = Math.min(minX, prevPoint.x);
    minY = Math.min(minY, prevPoint.y);
    maxX = Math.max(maxX, prevPoint.x);
    maxY = Math.max(maxY, prevPoint.y);
  }
  // make it a bit larger to fit:
  const dx = maxX - minX;
  const dy = maxY - minY;
  minX -= dx * 0.1;
  minY -= dy * 0.1;
  maxX += dx * 0.1;
  maxY += dy * 0.1;

  return {minX, minY, maxX, maxY}
}

function hslToRgb(h, s, l) {
  let r, g, b;

  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return { r, g, b };
}