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

let curves = [];
let minutesPerSegment = 15;
// at order 11 we want each segment length to be 15 minutes
// Order 11 has 4^11 cells and curve is continuous, passing each one
// of them in order, and has 4^11 - 1 segments. This means total available
// time is: 
let timeAvailable = minutesPerSegment * (Math.pow(4, 11) - 1);
endTime.innerText = new Date(startTime + timeAvailable * 60 * 1000).toLocaleDateString();
for (let i = 11; i > 0; i--) {
  let curve = new HilbertClock(i, 1024, startTime, 0x00FFFFFF);
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