import './hud.css';
import {vec3} from 'gl-matrix';
import sharedState from './sharedState';

function rgbToHsv(red, green, blue) {
  // Normalize the RGB values
  var r = red / 255;
  var g = green / 255;
  var b = blue / 255;

  // Find the maximum and minimum values of RGB
  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);

  var h, s, v;

  // Calculate the hue
  if (max === min) {
    h = 0; // No saturation, so hue is 0
  } else if (max === r) {
    h = ((g - b) / (max - min)) % 6;
  } else if (max === g) {
    h = (2 + (b - r) / (max - min)) % 6;
  } else if (max === b) {
    h = (4 + (r - g) / (max - min)) % 6;
  }

  h = Math.round(h * 60); // Convert hue to degrees

  // Calculate the saturation
  if (max === 0) {
    s = 0; // No maximum value, so saturation is 0
  } else {
    s = 1 - min / max;
  }

  s = Math.round(s * 100); // Convert saturation to percentage

  // Calculate the value
  v = Math.round(max * 100); // Convert value to percentage

  // Return the HSV values as an object
  return [h, s, v]
}

function hsvToRgb(hue, saturation, value) {
  // Convert hue to a value between 0 and 360 degrees
  var h = hue % 360;

  // Normalize the saturation and value to be between 0 and 1
  var s = saturation / 100;
  var v = value / 100;

  // Calculate chroma
  var c = v * s;

  // Calculate the hue sector
  var sector = h / 60;

  // Calculate intermediate values
  var x = c * (1 - Math.abs((sector % 2) - 1));
  var m = v - c;

  // Initialize RGB values
  var r, g, b;

  if (sector >= 0 && sector < 1) {
    r = c;
    g = x;
    b = 0;
  } else if (sector >= 1 && sector < 2) {
    r = x;
    g = c;
    b = 0;
  } else if (sector >= 2 && sector < 3) {
    r = 0;
    g = c;
    b = x;
  } else if (sector >= 3 && sector < 4) {
    r = 0;
    g = x;
    b = c;
  } else if (sector >= 4 && sector < 5) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  // Adjust RGB values
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  // Return the RGB values as an object
  return [r, g, b]
}


function getColor(rgbaNumber) {
  let r = (rgbaNumber >> 24) & 0xFF;
  let g = (rgbaNumber >> 16) & 0xFF;
  let b = (rgbaNumber >> 8) & 0xFF;

  return rgbToHsv(r, g, b);
}

export default function createHud(parent, view) {
  const holder = document.createElement('div');
  holder.innerHTML = getAxesHtml();
  while (holder.children.length > 0) {
    parent.appendChild(holder.children[0]);
  }

  const axesEl = parent.querySelector('.axes-container .axes');
  const locationEl = parent.querySelector('.axes-container .location');
  const pitchEl = parent.querySelector('.axes-container .ship-pitch');
  const crossLocationEl = parent.querySelector('.cross-location');

  const hueCirclePicker = createHueCirclePicker(parent.querySelector('.coordinate-plane'));

  view.on('updated', updateFromView);

  locationEl.addEventListener('change', () => {
    console.log('changed', locationEl.value);
    try {
      let newLocation = JSON.parse(locationEl.value);
      if (Array.isArray(newLocation) && newLocation.length === 3 && newLocation.every(n => typeof n === 'number')) {
        for (let i = 0; i < 3; ++i) {
          view.position[i] = newLocation[i];
        }
        view.update();
      }
    
    } catch(err) {
      console.error('Invalid location', err);
    }
  });

  updateFromView();
  function updateFromView() {
    let delta = vec3.transformQuat([0, 0, 0], [0, 0, -view.targetDistance], view.orientation);

    let xyAngle = Math.round(180 * Math.atan2(delta[1], delta[0]) / Math.PI - 90);

    axesEl.style.transform = `rotate(${xyAngle}deg)`;
    locationEl.value = getVectorString(view.position);

    let pitch = getPitchFromQuaternion(view.orientation);
    pitchEl.style.transform = `rotate(${pitch}deg)`;
    crossLocationEl.textContent = getVectorString([
      delta[0] + view.position[0],
      delta[1] + view.position[1],
      delta[2] + view.position[2]
    ]);
  }
}

function getVectorString(v) {
  return `[${v.map(n => n.toFixed(2)).join(', ')}]`;
}

function getPitchFromQuaternion(q) {
  let x = q[0];
  let y = q[1];
  let z = q[2];
  let w = q[3];
  let pitch = 90-Math.round(180 * Math.atan2(2 * (y * z + w * x), w * w - x * x - y * y + z * z) / Math.PI);
  return pitch;
}

function getAxesHtml() {
  return `
  <div class="coordinate-plane">
    <div class='axes-container level-indicator'>
      <div class="plane-axis">
        <div class="horizontal">
          <span class='axis-label'>pitch</span>
        </div>
      </div>

      <div class='plane-level'>
        <div class='ship-pitch'>
          <div class="ship-body"></div>
          <div class="ship-tail"></div>
        </div>
      </div>
    </div>
    <div class='axes-container'>
      <div class="axes">
        <div class="horizontal">
          <span class='right-arrow'></span>
          <span class='axis-label'>x</span>
        </div>
        <div class="vertical">
          <span class='top-arrow'></span>
          <span class='axis-label'>y</span>
        </div>
      </div>

      <div class='ship'>
        <div class='left'></div>
        <div class="center"></div>
        <div class="right"></div>
      </div>
      <input class="location" type='text'/>
    </div>
  </div>
  <div class="cross-container">
    <div class='indicator'>+</div>
    <div class="cross-location">
    </div>
  </div>`;
}

function createHueCirclePicker(parent) {
  const huePicker = document.createElement('div');
  huePicker.className = 'hue-picker';
  const hueCanvas = document.createElement('canvas');
  let width = hueCanvas.width = 80;
  let height = hueCanvas.height = 80;

  huePicker.style = `width: ${width}px; height: ${height}px;`;
  const ctx = hueCanvas.getContext('2d');
  const radius = width / 2;

  drawCircle();
  drawCurrent();

  huePicker.appendChild(hueCanvas);
  parent.appendChild(huePicker);

  hueCanvas.addEventListener('click', onHuePicked);
  hueCanvas.addEventListener('mousemove', onMouseMove);

  const currentHueEl = document.createElement('div');
  currentHueEl.style = 'transform: translate(-50%, -50%); position: absolute; top: 50%; left: 50%;';
  let hsl = getColor(sharedState.rgba);
  currentHueEl.style.color = `hsl(${hsl[0] || 0}, 80%, 50%)`;
  currentHueEl.innerText = Math.round(hsl[0]);
  huePicker.appendChild(currentHueEl);
  return {};

  function drawCircle() {
    for (let angle = 0; angle <= 360; angle += 1) {
      ctx.beginPath();
      ctx.strokeStyle = `hsl(${angle}, 80%, 50%)`;
      const ca = Math.cos(angle * Math.PI / 180);
      const sa = Math.sin(angle * Math.PI / 180);
      ctx.moveTo(radius * (1 + 0.7 * ca), radius * (1 + 0.7 * sa));
      ctx.lineTo(radius * (1 + .9 * ca), radius * (1 + .9 * sa));
      ctx.stroke();
    }
  }

  function drawCurrent() {
    let hsl = getColor(sharedState.rgba);
    let angle = Math.round(hsl[0]);
    ctx.beginPath();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    const ca = Math.cos(angle * Math.PI / 180);
    const sa = Math.sin(angle * Math.PI / 180);
    ctx.moveTo(radius * (1 + 0.6 * ca), radius * (1 + 0.6 * sa));
    ctx.lineTo(radius * (1 + ca), radius * (1 + sa));
    ctx.stroke();
  }

  function onHuePicked(e) {
    let rect = hueCanvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    let dx = x - radius;
    let dy = y - radius;
    let angle = Math.round(180 * Math.atan2(dy, dx) / Math.PI);
    if (angle < 0) angle += 360;
    let rgb = hsvToRgb(angle, 80, 50);

    sharedState.rgba = (rgb[0] << 24) | (rgb[1] << 16) | (rgb[2] << 8) | 0x3f;

    redraw();
  }

  function onMouseMove(e) {
    if (e.buttons === 1) {
      onHuePicked(e);
    }
  }

  function redraw() {
    ctx.clearRect(0, 0, width, height);
    drawCircle();
    drawCurrent();

    let hsl = getColor(sharedState.rgba);
    currentHueEl.style.color = `hsl(${hsl[0] || 0}, 80%, 50%)`;
    if (hsl[0] < 0) hsl[0] += 360;
    currentHueEl.innerText = Math.round(hsl[0] || 0);
  }
}