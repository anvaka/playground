import './style.css';
import {createScene, PointCollection} from 'w-gl';
import HilbertClock from './HilbertClock.js';
const canvas = document.getElementById('hilbertCanvas');

const legend = document.querySelector('.legend');

let scene = createScene(canvas, {allowPinchRotation: false});
scene.setClearColor(0x1b/0xff, 0x29/0xff, 0x4a/0xff, 1.)

const startTimeAsString = '2004-10-13';
const endTime = document.querySelector('#end-date');
const startTimeInput = document.querySelector('#start-date');
startTimeInput.value = startTimeAsString;
startTimeInput.addEventListener('change', (e) => {
  const newStartTime = new Date(e.target.value).getTime();
  curves.forEach(curve => {
    curve.setStartTime(newStartTime);
    curve.setCurrentTime(now);
  });
  scene.renderFrame();
  updateCurrentTime();
  endTime.innerText = new Date(newStartTime + timeAvailable * 60 * 1000).toLocaleDateString();
});

let startTime = new Date(startTimeAsString).getTime();
const sceneSize = 1024;

let curves = [];
let minutesPerSegment = 15;
// at order 11 we want each segment length to be 15 minutes
// Order 11 has 4^11 cells and curve is continuous, passing each one
// of them in order, and has 4^11 - 1 segments. This means total available
// time is: 
let timeAvailable = minutesPerSegment * (Math.pow(4, 11) - 1);
endTime.innerText = new Date(startTime + timeAvailable * 60 * 1000).toLocaleDateString();
for (let i = 11; i > 0; i--) {
  let curve = new HilbertClock(i, sceneSize, startTime, 0x00FFFFFF);
  // curve.minutesPerSegment = minutesPerSegment;
  // minutesPerSegment *= 4;
  curve.minutesPerSegment = timeAvailable / (curve.totalSegments - 1);
  curve.generateCurve();

  curve.setCurrentTime(startTime);
  curves.push(curve);
}

let points = new PointCollection(1);
scene.setViewBox({
  left: 0,
  top: 1024,
  right: 1024,
  bottom: 0 
});

const zLevel = scene.getDrawContext().view.position[2];
let currentCurveIndex = scaleZ(zLevel);
let currentCurve = curves[currentCurveIndex];
updateLegend();

let now = new Date().getTime();
currentCurve.setCurrentTime(now);
let currentTime = points.add({
  x: currentCurve.currentPosition.x,
  y: currentCurve.currentPosition.y,
  z: 0,
  color: 0xff0000ff,
  size: 1 
});

scene.appendChild(currentCurve.positions);
scene.appendChild(points);
scene.on('transform', (t) => {
  let z = t.drawContext.view.position[2];
  let newCurrentCurveIndex = scaleZ(z);
  if (newCurrentCurveIndex !== currentCurveIndex) {
    currentCurveIndex = newCurrentCurveIndex;
    scene.getRoot().removeChild(currentCurve.positions);
    currentCurve = curves[currentCurveIndex];
    scene.appendChild(currentCurve.positions);

    updateCurrentTime();
    updateLegend();
  }
});

scene.on('mousemove', function(e) {
  let {x, y} = e;
  if (x < 0 || x > sceneSize || y < 0 || y > sceneSize) {
    return;
  }
  const hilbertMax = (1 << 16) - 1;
  let x_n = Math.floor(hilbertMax * x / currentCurve.size);
  let y_n = Math.floor(hilbertMax * y / currentCurve.size);
  let index = hilbert(x_n, y_n);
  console.log(`x: ${x}, y: ${y}, x_n: ${x_n}, y_n: ${y_n}, index: ${index}`);
});

setInterval(updateCurrentTime, 1000);

function updateCurrentTime() {
  now = new Date().getTime();
  currentCurve.setCurrentTime(now);
  let size = Math.pow(2, Math.log(currentCurve.cellSize / 2) / Math.log(2));

  currentTime.update({
    x: currentCurve.currentPosition.x,
    y: currentCurve.currentPosition.y,
    z: 0,
    color: 0xff0000ff,
    size: size
  });
  scene.renderFrame();
}

function scaleZ(z) {
    const zmin = 5;
    const zmax = 10000;
    const zoomMin = 0;
    const zoomMax = 10;
    const exponent = 0.38; // Adjusted exponent for slower scaling at lower z values

    if (z <= zmin) {
        return zoomMin;
    } else if (z >= zmax) {
        return zoomMax;
    } else {
        const ratio = (z - zmin) / (zmax - zmin);
        const zoomLevel = Math.pow(ratio, exponent) * (zoomMax - zoomMin) + zoomMin;
        return Math.round(zoomLevel);
    }
}


function updateLegend() {
  let humanTime = formatTime(currentCurve.minutesPerSegment);
  legend.innerText = 'Single segment is ' + humanTime;
}

function formatTime(minutes) {
    if (minutes < 1) {
        return "less than a minute";
    }
    
    const timeUnits = [
        { unit: "year", minutes: 525600 },
        { unit: "month", minutes: 43800 },
        { unit: "week", minutes: 10080 },
        { unit: "day", minutes: 1440 },
        { unit: "hour", minutes: 60 },
        { unit: "minute", minutes: 1 }
    ];
    
    for (let i = 0; i < timeUnits.length; i++) {
        const { unit, minutes: unitMinutes } = timeUnits[i];
        if (minutes >= unitMinutes) {
            const value = Math.round(minutes / unitMinutes);
            let isApproximate = value !== (minutes / unitMinutes);
            return `${isApproximate ? '~' : ''}${value} ${unit}${value > 1 ? 's' : ''}`;
        }
    }
}

/**
 * Fast Hilbert curve algorithm by http://threadlocalmutex.com/
 * Ported from C++ https://github.com/rawrunprotected/hilbert_curves (public domain)
 * @param {number} x
 * @param {number} y
 */
function hilbert(x, y) {
    let a = x ^ y;
    let b = 0xFFFF ^ a;
    let c = 0xFFFF ^ (x | y);
    let d = x & (y ^ 0xFFFF);

    let A = a | (b >> 1);
    let B = (a >> 1) ^ a;
    let C = ((c >> 1) ^ (b & (d >> 1))) ^ c;
    let D = ((a & (c >> 1)) ^ (d >> 1)) ^ d;

    a = A; b = B; c = C; d = D;
    A = ((a & (a >> 2)) ^ (b & (b >> 2)));
    B = ((a & (b >> 2)) ^ (b & ((a ^ b) >> 2)));
    C ^= ((a & (c >> 2)) ^ (b & (d >> 2)));
    D ^= ((b & (c >> 2)) ^ ((a ^ b) & (d >> 2)));

    a = A; b = B; c = C; d = D;
    A = ((a & (a >> 4)) ^ (b & (b >> 4)));
    B = ((a & (b >> 4)) ^ (b & ((a ^ b) >> 4)));
    C ^= ((a & (c >> 4)) ^ (b & (d >> 4)));
    D ^= ((b & (c >> 4)) ^ ((a ^ b) & (d >> 4)));

    a = A; b = B; c = C; d = D;
    C ^= ((a & (c >> 8)) ^ (b & (d >> 8)));
    D ^= ((b & (c >> 8)) ^ ((a ^ b) & (d >> 8)));

    a = C ^ (C >> 1);
    b = D ^ (D >> 1);

    let i0 = x ^ y;
    let i1 = b | (0xFFFF ^ (i0 | a));

    i0 = (i0 | (i0 << 8)) & 0x00FF00FF;
    i0 = (i0 | (i0 << 4)) & 0x0F0F0F0F;
    i0 = (i0 | (i0 << 2)) & 0x33333333;
    i0 = (i0 | (i0 << 1)) & 0x55555555;

    i1 = (i1 | (i1 << 8)) & 0x00FF00FF;
    i1 = (i1 | (i1 << 4)) & 0x0F0F0F0F;
    i1 = (i1 | (i1 << 2)) & 0x33333333;
    i1 = (i1 | (i1 << 1)) & 0x55555555;

    return ((i1 << 1) | i0) >>> 0;
}