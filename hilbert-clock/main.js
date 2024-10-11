import './style.css';
import {createScene, PointCollection} from 'w-gl';
import HilbertClock from './HilbertClock.js';
const canvas = document.getElementById('hilbertCanvas');

let scene = createScene(canvas);
scene.setClearColor(0x1b/0xff, 0x29/0xff, 0x4a/0xff, 1.)

const clock = new HilbertClock(11, 1024, new Date('2024-10-09').getTime());
let points = new PointCollection(1);

scene.setViewBox({
  left: 0,
  top: 1024,
  right: 1024,
  bottom: 0 
})
clock.generateCurve();
clock.setCurrentTime(new Date().getTime());
let currentTime = points.add({
  x: clock.currentPosition.x,
  y: clock.currentPosition.y,
  z: 0,
  color: 0xff0000ff,
  size: .1 
})
scene.appendChild(clock.positions);
scene.appendChild(points);
setInterval(() => {
  clock.setCurrentTime(new Date().getTime());
  currentTime.update({
    x: clock.currentPosition.x,
    y: clock.currentPosition.y,
    z: 0,
    color: 0xff0000ff,
    size: .1 
  });
  scene.renderFrame();
}, 1000);