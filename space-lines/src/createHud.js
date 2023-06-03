import './hud.css';
import {vec3} from 'gl-matrix';
import sharedState from './sharedState';
import eventify from 'ngraph.events';

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
    <div>+</div>
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
  currentHueEl.style.color = `hsl(${sharedState.hue || 0}, 80%, 50%)`;
  currentHueEl.innerText = sharedState.hue || 0;
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
    let angle = Math.round(sharedState.hue || 0);
    // we are going to draw white circle to indicate where the current hue value is:
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

    sharedState.hue = angle < 0 ? angle + 360 : angle;

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

    currentHueEl.style.color = `hsl(${sharedState.hue || 0}, 80%, 50%)`;
    currentHueEl.innerText = sharedState.hue || 0;
  }
}