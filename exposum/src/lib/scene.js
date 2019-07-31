const panzoom = require('panzoom');
const wgl = require('w-gl');

module.exports = function createScene() {
  let lastSumCalculator;
  let width, height;
  let touched = false;
  let lines;
  let lastPoint = {x: 0, y: 0};
  let boundingBox;

  let canvas = document.getElementById('scene-canvas');
  updateSize();
  listenToEvents();

  let webGLScene = wgl.scene(canvas, {
      size: {
        width,
        height
      }
  });
  webGLScene.setClearColor(12/255, 41/255, 82/255, 1)
  webGLScene.setPixelRatio(1);

  window.addEventListener('resize', redrawCurrentPoints);

  return {
    setSumCalculator,
    redrawCurrentPoints,
    restartCalculator,
    dispose
  }

  function dispose() {
    webGLScene.dispose();
    removeEventListeners();
  }

  function listenToEvents() {
    canvas.addEventListener('mousedown', markTouched)
    canvas.addEventListener('touchstart', markTouched)
    canvas.addEventListener('wheel', markTouched)
  }

  function removeEventListeners() {
    canvas.removeEventListener('mousedown', markTouched)
    canvas.removeEventListener('touchstart', markTouched)
    canvas.removeEventListener('wheel', markTouched)
  }

  function setSumCalculator(sumCalculator) {
    touched = false;
    updateSize();
    createSumCalculator(sumCalculator);
  }

  function restartCalculator() {
    if (!lastSumCalculator) {
      return;
    }
    lastSumCalculator.stop();
    lastSumCalculator.reset();
    updateLines();
    lastSumCalculator.run(drawPoints);
  }

  function createSumCalculator(sumCalculator) {
    if (lastSumCalculator) {
      lastSumCalculator.stop();
      lastSumCalculator = null;
    }

    lastSumCalculator = sumCalculator;
    lastSumCalculator.evaluateBoundingBox();
    boundingBox = lastSumCalculator.getBoundingBox();
    updateLines();
    lastSumCalculator.run(drawPoints);
  }

  function updateLines() {
    lastPoint = {x: 0, y: 0};
    let options = lastSumCalculator.getOptions();
    if (lines) {
      webGLScene.removeChild(lines);
    }
    lines = new wgl.WireCollection(options.totalSteps);
    // lines.color.a = 0.4;
    webGLScene.appendChild(lines);
  }

  function redrawCurrentPoints() {
    updateSize();
    webGLScene.renderFrame();
  }

  function updateSize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  function markTouched() {
    touched = true;
  }

  function drawPoints(newPoints) {
    if (newPoints) {
      newPoints.forEach(point => {
        lines.add({
          from: {x: lastPoint.x, y: lastPoint.y},
          to: {x: point.x, y: point.y}
        });
        lastPoint = point
      })
    }
    if (lastSumCalculator && !touched) {
      boundingBox = lastSumCalculator.getBoundingBox();

      webGLScene.setViewBox({
        left:  boundingBox.minX,
        top:   boundingBox.minY,
        right:  boundingBox.maxX,
        bottom: boundingBox.maxY,
      })
    }

    webGLScene.renderFrame();
    return;
  }
};
