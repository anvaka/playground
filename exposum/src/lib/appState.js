var expoSum = require('./expoSum.js');

var defaultCode = `function f(k) {
  // Return \`f(k)\` part of exponential sum:
  //
  //   sum{k=1..n} e^(2 * PI * i * f(k))
  // 
  // See syntax help above for more info.

  return k / 3;
  // var l = Math.log(k);
  // return l * l * l * l;
}`

var boundingBox;

var code = {
  code: defaultCode,
  error: null,
  isImmediate: false,
  setCode(newCode, immediate) {
    var newNext = compileNextFunction(newCode);
    if (!newNext) return; // error

    code.error = null;
    code.code = newCode;

    generatorOptions.next = newNext;
    if (immediate) {
      redraw();
    } else if (!code.immediate) {
      dirty();
    }
    code.immediate = immediate;
  }
}

var generatorOptions = {
  next: compileNextFunction(defaultCode),
  seed: seedPoint,
  stepsPerIteration: 10,
  onFrame,
};

var lineColor = 'rgba(255, 255, 255, 0.6)';
var fillColor = 'rgba(27, 41, 74, 1.0)';

window.addEventListener('resize', dirty);

var appState = {
  isDirty: false,
  init,
  code,
  redraw,

  getLineColor() { return lineColor },
  setLineColor(r, g, b, a) { 
    lineColor = `rgba(${r}, ${g}, ${b}, ${a})`; 
    dirty();
  },
  getFillColor() { return fillColor; },
  setFillColor(r, g, b, a) {
    fillColor = `rgba(${r}, ${g}, ${b}, ${a})`; 
    dirty();
  },
  getStepsPerIteration() { return generatorOptions.stepsPerIteration; },
  setStepsPerIteration(newValue) { 
    generatorOptions.stepsPerIteration = getNumber(newValue, generatorOptions.stepsPerIteration);
    dirty();
  },

  settingsPanel: {
    collapsed: true
  },
}

var seedPoint = selectSeedPoint();


module.exports = appState

var lastLineRenderer;
var canvas = document.getElementById('scene-canvas'); 
var ctx = canvas.getContext('2d'); 
var width, height;
init();

function init() {
  redraw();
}

function selectSeedPoint() {
  return {
    x: 0,
    y: 0
  }
}

function getNumber(str, defaultValue) {
  var parsed = Number.parseFloat(str);
  if (Number.isNaN(parsed)) return defaultValue;
  return parsed;
}

function redraw() {
  appState.settingsPanel.isDirty = false;
  updateSize();
  render();
}

function dirty() {
  updateSize();
  if (lastLineRenderer) {
    drawPoints(lastLineRenderer.getPoints());
  }
}

function updateSize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

function render() {
  if (lastLineRenderer) {
    lastLineRenderer.dispose();
    lastLineRenderer = null;
  }

  lastLineRenderer = expoSum(generatorOptions)
  lastLineRenderer.evaluateBoundingBox();
  boundingBox = lastLineRenderer.getBoundingBox();
  lastLineRenderer.run();
}

function onFrame(points) {
  drawPoints(points);
  return true;
}

function drawPoints(points) {
  ctx.beginPath()
  ctx.fillStyle = fillColor
  ctx.clearRect(0, 0, width, height);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = lineColor;
  points.forEach((point, index) => {
    let pt = transform(point);
    if (index) {
      ctx.lineTo(pt.x, pt.y);
    } else {
      ctx.moveTo(pt.x, pt.y);
    }
  })
  ctx.stroke();
  ctx.closePath();
}

function transform(pt) {
  const w = width;
  const h = height;
  const dx = (boundingBox.maxX - boundingBox.minX);
  const dy = (boundingBox.maxY - boundingBox.minY);
  // const scale = Math.max(dx, dy);
  var scaleX = w / dx;
  var scaleY = h / dy;
  var scale = scaleX * dy < h ? scaleX : scaleY;

  var tx = (pt.x - boundingBox.minX) * scale;
  var ty = (pt.y - boundingBox.minY) * scale;
  var mp = (dx) / 2
  console.log(mp, boundingBox.minX, boundingBox.maxX)
  // var ar = width/height;
  //tx /= ar;
  return {
    x: tx,
    y: ty
  }
}

function compileNextFunction(code) {
  try {
    var creator = new Function(code + '\nreturn f;');
    var next = creator();
    next(0); // just a test.
    return next;
  } catch (e) {
    code.error = e.message;
    return null;
  }
}