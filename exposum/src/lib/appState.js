var expoSum = require('./expoSum.js');

var defaultCode = `function f(k) {
  // Return \`f(k)\` part of exponential sum:
  //
  //   sum{k=1..n} e^(2 * PI * i * f(k))
  // 
  // See syntax help above for more info.

  var l = Math.log(k);
  return l * l * l * l;
}`

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
  next: null,
  seed: seedPoint,
  stepsPerIteration: 10,
  onPointAdded,
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
var canvas, ctx, width, height;

function init(c) {
  canvas = c;
  ctx = canvas.getContext('2d');
  generatorOptions.code = compileNextFunction(defaultCode);
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
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = fillColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  render();
}

function dirty() {
  appState.settingsPanel.isDirty = true;
}

function render() {
  if (lastLineRenderer) {
    lastLineRenderer.dispose();
    lastLineRenderer = null;
  }

  lastLineRenderer = expoSum(generatorOptions)
  lastLineRenderer.run();
}

function onPointAdded(a, b) {
  ctx.beginPath();
  ctx.strokeStyle = lineColor;
  a = transform(a);
  b = transform(b);
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.closePath();
  return true;
}

function transform(pt) {
  var tx = (pt.x - boundingBox.left)/boundingBox.width;
  var ty = (pt.y - boundingBox.top)/boundingBox.height;
  // var ar = width/height;
  //tx /= ar;
  return {
    x: tx * width,
    y: (1 - ty) * height
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