import './style.css';
import {createScene, PointCollection} from 'w-gl';
import HilbertClock from './HilbertClock.js';
const canvas = document.getElementById('hilbertCanvas');

let scene = createScene(canvas);
scene.setClearColor(0x1b/0xff, 0x29/0xff, 0x4a/0xff, 1.)

let startTime = new Date('2004-10-11').getTime();
const clock = new HilbertClock(11, 1024, startTime, 0xffFFFF8f);
const hours = new HilbertClock(8, 1024, startTime, 0x8f00FFFF);
hours.minutesPerSegment = 60* 4*4;
const quarterHours = new HilbertClock(9, 1024, startTime, 0x00FF7f7f);

let points = new PointCollection(2);

scene.setViewBox({
  left: 0,
  top: 1024,
  right: 1024,
  bottom: 0 
})
clock.generateCurve();
hours.generateCurve();
let now = new Date().getTime();
clock.setCurrentTime(now);
hours.setCurrentTime(now);
let currentMinute = points.add({
  x: clock.currentPosition.x,
  y: clock.currentPosition.y,
  z: 0,
  color: 0xff0000ff,
  size: .1 
});

let currentHour = points.add({
  x: hours.currentPosition.x,
  y: hours.currentPosition.y,
  z: 0,
  color: 0xff00ff00,
  size: .1 
});
scene.appendChild(clock.positions);
scene.appendChild(points);

scene.appendChild(hours.positions);

// quarterHours.generateCurve();
// scene.appendChild(quarterHours.positions);
setInterval(() => {
  now = new Date().getTime();
  clock.setCurrentTime(now);
  hours.setCurrentTime(now);

  currentMinute.update({
    x: clock.currentPosition.x,
    y: clock.currentPosition.y,
    z: 0,
    color: 0xff0000ff,
    size: .1 
  });
  currentHour.update({
    x: hours.currentPosition.x,
    y: hours.currentPosition.y,
    z: 0,
    color: 0xff00ffFF,
    size: .1 
  });
  scene.renderFrame();
}, 1000);