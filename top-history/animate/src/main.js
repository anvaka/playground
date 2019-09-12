// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'

import bands from '../static/coeff.json';
import story from '../static/values.json'
window.bands = bands;
window.story = story;

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  template: '<App/>'
})

// runAnimation(document.getElementById('canvas'), data)

function runAnimation(canvas, data) {
  const ctx = canvas.getContext('2d');
  const r = 100;
  const w = 640;
  const h = 480;
  const canvasPoints = getCanvasPoints(data);
  const bounds = computeMinMax(canvasPoints);
  canvas.width = ctx.width = w;
  canvas.height = ctx.height = w;
  drawCircle(0, 0, r);

  let lastPoint = 0;
  frame();

  console.log(data);

  function frame() {
    let i = 0;
    const canvasData = ctx.getImageData(0, 0, w, h);
    let max = {score: Number.NEGATIVE_INFINITY};
    while (lastPoint < canvasPoints.length && i < 100) {
      const pt = canvasPoints[lastPoint];
      drawPoint(pt);
      if (pt.score > max.score) max = pt;
      i += 1;
      lastPoint += 1;
    }
    console.log(max, lastPoint);
    ctx.putImageData(canvasData, 0, 0);
    if (lastPoint < canvasPoints.length) requestAnimationFrame(frame);

    function drawPoint(modelPoint) {
      const pt = toCanvasPoint(modelPoint.x, modelPoint.y);
      const index = (Math.round(pt.x) + Math.round(pt.y) * w) * 4;
      canvasData.data[index + 0] = 0;
      canvasData.data[index + 1] = 0;
      canvasData.data[index + 2] = 244;
      canvasData.data[index + 3] = 255;
    }
  }

  function computeMinMax(array) {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    array.forEach(pt => {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    });
    return {minX, minY, maxX, maxY};
  }

  function getCanvasPoints(data) {
    const canvasPoints = [];
    data.forEach((snapshot) => {
      let time = new Date(snapshot.time);
      let minutes = time.getHours() * 60 + time.getMinutes();
      let angle = 2 * Math.PI * minutes/(24 * 60);
      snapshot.posts.forEach(post => {
        if (Math.abs(time - new Date(post.created_utc * 1000)) > 24*60*60*1000) {
          return;
        }
        const score = post.score || 0;
        let pointR = score + r;
        const x = pointR * Math.cos(angle);
        const y = pointR * Math.sin(angle);
        const pt = {x, y, a: 0.3, score, title: post.title}
        canvasPoints.push(pt)
      })
    });

    return canvasPoints;
  }

  function drawCircle(x, y, r) {
    let pt = toCanvasPoint(x, y);
    ctx.arc(pt.x, pt.y, r, 0, 2 * Math.PI);
    ctx.stroke();
  }

  function toCanvasPoint(x, y) {
    const cw = (bounds.maxX - bounds.minX);
    const ch = (bounds.maxY - bounds.minY);
    return {
      x: w * (x - bounds.minX)/cw,
      y: h * (y - bounds.minY)/ch
    }
  }
}
