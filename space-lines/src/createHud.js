import './hud.css';
import {vec3} from 'gl-matrix';

export default function createHud(parent, view) {
  const holder = document.createElement('div');
  holder.innerHTML = getAxesHtml();
  while (holder.children.length > 0) {
    parent.appendChild(holder.children[0]);
  }

  const axesEl = parent.querySelector('.axes-container .axes');
  const locationEl = parent.querySelector('.axes-container .location');
  const pitchEl = parent.querySelector('.axes-container .ship-pitch');

  view.on('updated', updateFromView);
  updateFromView();

  function updateFromView() {
    let delta = vec3.transformQuat([0, 0, 0], [0, 0, -5], view.orientation);

    let xyAngle = Math.round(180 * Math.atan2(delta[1], delta[0]) / Math.PI - 90);

    axesEl.style.transform = `rotate(${xyAngle}deg)`;
    locationEl.textContent = `[${view.position.map(n => n.toFixed(2)).join(', ')}]`;

    let pitch = getPitchFromQuaternion(view.orientation);
    pitchEl.style.transform = `rotate(${pitch}deg)`;
  }
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
      <div class="location"></div>
    </div>
  </div>
  <div class="cross-container">
    <div>+</div>
  </div>`;
}

function getCrossHtml() {
  return ``;
}