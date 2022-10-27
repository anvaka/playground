import { zetaComplex } from './naive.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;
let currentAnimationFrame = null;

let iterations = 1000;
let iterationsPerFrame = 10;

// drawIt(s);
document.querySelector('#form').addEventListener('submit', (e) => {
  const im = Number.parseFloat(document.querySelector('#imaginary').value);
  const re = Number.parseFloat(document.querySelector('#real').value);
  iterationsPerFrame = Number.parseInt(document.querySelector('#iterationsPerFrame').value);
  iterations = Number.parseInt(document.querySelector('#iterations').value);
  drawIt({re, im});
  e.preventDefault();
});

function drawIt(s) {
  cancelAnimationFrame(currentAnimationFrame);
  // Clear canvas with black color
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let currentIteration = 1;
  let sum = {re: 0, im: 0};
  const bounds = getBounds(s)
  let screenPos = transformToScreen(sum);
  drawAxes();
  ctx.beginPath();
  ctx.strokeStyle = 'deepskyblue';
  ctx.moveTo(screenPos.x, screenPos.y);
  ctx.lineWidth = 1;

  currentAnimationFrame = requestAnimationFrame(drawFrame);

  function drawFrame() {
    for (let i = 0; i < iterationsPerFrame; i++) {
      sum = getNext(sum, s, currentIteration);
      screenPos = transformToScreen(sum);
      ctx.lineTo(screenPos.x, screenPos.y);
      ctx.stroke();
      currentIteration++;
    }

    if (currentIteration < iterations) {
      currentAnimationFrame = requestAnimationFrame(drawFrame);
    } else {
      // s.im += 0.01;
      // document.querySelector('#imaginary').value = s.im;
      // drawIt(s)
    }
  }

  function getNext(sum, s, n) {
    const c = Math.pow(n, -s.re);
    sum.re += c * Math.cos(s.im * Math.log(n));
    sum.im += c * Math.sin(s.im * Math.log(n));
    return sum;
  }

  function transformToScreen(c) {
      const x = (c.re - bounds.minRe) / (bounds.maxRe - bounds.minRe) * width;
      const y = (c.im - bounds.minIm) / (bounds.maxIm - bounds.minIm) * height;
      return {x, y};
  }

  function getBounds(s) {
      const bounds = {minRe: Infinity, maxRe: -Infinity, minIm: Infinity, maxIm: -Infinity};
      let sum = {re: 0, im: 0};
      for (let n = 1; n < iterations; n++) {
          sum = getNext(sum, s, n);
          if (sum.re < bounds.minRe) bounds.minRe = sum.re;
          if (sum.re > bounds.maxRe) bounds.maxRe = sum.re;
          if (sum.im < bounds.minIm) bounds.minIm = sum.im;
          if (sum.im > bounds.maxIm) bounds.maxIm = sum.im;
      }
      if (bounds.minIm === bounds.maxIm) {
          bounds.minIm -= 1;
          bounds.maxIm += 1;
      }
      if (bounds.minRe === bounds.maxRe) {
          bounds.minRe -= 1;
          bounds.maxRe += 1;
      }
      return bounds;
  }

  function drawAxes() {
    ctx.beginPath();
    ctx.strokeStyle = 'white';
    let yAxisStart = transformToScreen({re: 0, im: bounds.minIm});
    let yAxisEnd = transformToScreen({re: 0, im: bounds.maxIm});
    ctx.moveTo(yAxisStart.x, yAxisStart.y);
    ctx.lineTo(yAxisEnd.x, yAxisEnd.y);
    ctx.stroke();

    let xAxisStart = transformToScreen({re: bounds.minRe, im: 0});
    let xAxisEnd = transformToScreen({re: bounds.maxRe, im: 0});
    ctx.moveTo(xAxisStart.x, xAxisStart.y);
    ctx.lineTo(xAxisEnd.x, xAxisEnd.y);
    ctx.stroke();
  }
}
