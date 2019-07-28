const {useDecimal} = require('./config');
const expoSum = require('./expoSum.js');
const panzoom = require('panzoom');

const Decimal = require('decimal.js');
window.Decimal = Decimal;
var lastPoints;
var defaultCode = useDecimal ? `function f(k) {
  return (new Decimal(k)).div(3);
}` : `function f(k) {
  return k / 3;
}`;

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
  totalSteps: 20000,
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

  getTotalSteps() { return generatorOptions.totalSteps; },
  setTotalSteps(newValue) {
    generatorOptions.totalSteps = getNumber(newValue, generatorOptions.totalSteps);
    redraw();
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
var transformMatrix = {};
var canvas = document.getElementById('scene-canvas'); 
var zoomer = panzoom(canvas, {
  controller: canvasController(canvas, transformMatrix)
});

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
  lastPoints = points;
  ctx.beginPath()
  ctx.fillStyle = fillColor
  ctx.clearRect(0, 0, width, height);
  ctx.stroke();
  
  ctx.save();
  
  ctx.setTransform(
    transformMatrix.scale, 
    0, 0, transformMatrix.scale, transformMatrix.dx, transformMatrix.dy);
    ctx.lineWidth = 1/transformMatrix.scale;
  ctx.beginPath();
  ctx.strokeStyle = lineColor;
  const {minX, minY, maxX, maxY} = boundingBox;
  const dx = (maxX - minX);
  const dy = (maxY - minY);
  const scale = Math.max(dx, dy);
  
  points.forEach((pt, index) => {
    // let pt = transform(point);
    if (index) {
      ctx.lineTo((pt.x - minX - dx/2)/scale, 1 - (pt.y - minY - dy / 2) / scale);
    } else {
      ctx.moveTo((pt.x - minX - dx/2)/scale, 1 - (pt.y - minY - dy / 2) / scale);
    }
  })
  ctx.stroke();
  ctx.closePath();
  ctx.restore();
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
    console.error(e);
    return null;
  }
}

function canvasController(canvas, transform) {
  var controller = {
    applyTransform(newT) {
      var pixelRatio = 1; // scene.getPixelRatio();

      transform.dx = newT.x * pixelRatio;
      transform.dy = newT.y * pixelRatio;
      transform.scale = newT.scale;
      transform.dirty = true;
      if (lastLineRenderer.isDone()) {
        // todo remove this.
        drawPoints(lastPoints);
      }
      // scene.renderFrame()
    },

    getOwner() {
      return canvas
    }
  }
  return controller;
}