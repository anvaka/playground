const wgl = require('w-gl');
const bus = require('../bus');
const LineStrip = require('./lines/LineStrip').default;

module.exports = function createScene() {
  let lastSumCalculator;
  // let width, height;
  let touched = false;
  let lines;
  let lineA = 0.06, lineR = 255, lineG = 255, lineB = 255;
  let sceneA = 1, sceneR = 12, sceneG = 41, sceneB = 82;
  let boundingBox;

  let canvas = document.getElementById('scene-canvas');
  listenToEvents();

  let webGLScene = wgl.scene(canvas, {});
  webGLScene.setClearColor(sceneR/255, sceneG/255, sceneB/255, sceneA)
  webGLScene.setPixelRatio(1);

  window.addEventListener('resize', redrawCurrentPoints);

  return {
    setSumCalculator,
    restartCalculator,
    redrawCurrentPoints,
    dispose,
    setClearColor,
    getClearColor,
    setLineColor,
    getLineColor
  }

  function setClearColor(r, g, b, a) {
    sceneR = r;
    sceneG = g;
    sceneB = b;
    sceneA = Math.round(a * 100)/100;

    webGLScene.setClearColor(sceneR/255, sceneG/255, sceneB/255, sceneA)
  }

  function setLineColor(r, g, b, a) {
    lineR = r;
    lineG = g;
    lineB = b;
    lineA = a;

    if (lines) {
      lines.color.r = lineR/255;
      lines.color.g = lineG/255;
      lines.color.b = lineB/255;
      lines.color.a = lineA;
      webGLScene.renderFrame();
    }
  }

  function getLineColor() {
    return `rgba(${lineR}, ${lineG}, ${lineB}, ${Math.round(lineA * 100)/100})`; 
  }

  function getClearColor() {
    return `rgba(${sceneR}, ${sceneG}, ${sceneB}, ${sceneA})`; 
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
    createSumCalculator(sumCalculator);
  }

  function createSumCalculator(sumCalculator) {
    if (lastSumCalculator) {
      lastSumCalculator.stop();
      lastSumCalculator = null;
    }

    lastSumCalculator = sumCalculator;
    // lastSumCalculator.evaluateBoundingBox();
    // boundingBox = lastSumCalculator.getBoundingBox();
    updateLines();
    lastSumCalculator.run(drawPoints);
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


  function updateLines() {
    lastPoint = {x: 0, y: 0};
    let options = lastSumCalculator.getOptions();
    if (lines) {
      webGLScene.removeChild(lines);
    }
    lines = new LineStrip(Math.min(options.bufferSize));
    lines.color.r = lineR/255;
    lines.color.g = lineG/255;
    lines.color.b = lineB/255;
    lines.color.a = lineA;
    lines.add(0, 0);
    webGLScene.appendChild(lines);
  }

  function redrawCurrentPoints() {
    webGLScene.renderFrame();
  }

  function markTouched() {
    touched = true;
  }

  function drawPoints(newPoints) {
    if (!lastSumCalculator) {
      return;
    }
    if (newPoints) {
      newPoints.forEach(point => {
        lines.add(point.x, point.y);
      })
    }

    if (!touched) {
      boundingBox = lastSumCalculator.getBoundingBox();
      let dx = (boundingBox.maxX - boundingBox.minX) * 0.1;
      let dy = (boundingBox.maxY - boundingBox.minY) * 0.1;

      webGLScene.setViewBox({
        left:  boundingBox.minX - dx,
        top:   boundingBox.minY - dy,
        right:  boundingBox.maxX + dx,
        bottom: boundingBox.maxY + dy,
      })
    }

    webGLScene.renderFrame();
    bus.fire('progress', lastSumCalculator.getCurrentStep(), lastSumCalculator.getTotalSteps())
    return;
  }
};
