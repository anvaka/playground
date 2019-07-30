const panzoom = require('panzoom');

module.exports = function createScene() {
  var lastSumCalculator;
  var transformMatrix = {};
  var canvas = document.getElementById('scene-canvas');
  var zoomer = panzoom(canvas, {
    controller: canvasController(canvas, transformMatrix)
  });

  var ctx = canvas.getContext('2d');
  var width, height;
  var lineColor = 'rgba(255, 255, 255, 0.6)';
  var fillColor = 'rgba(27, 41, 74, 1.0)';
  var lastPoints;
  var boundingBox;

  window.addEventListener('resize', redrawCurrentPoints);

  return {
    setSumCalculator,
    redrawCurrentPoints,
    restartCalculator
  }

  function setSumCalculator(sumCalculator) {
    updateSize();
    createSumCalculator(sumCalculator);
  }

  function restartCalculator() {
    if (!lastSumCalculator) {
      return;
    }
    lastSumCalculator.reset();
  }

  function createSumCalculator(sumCalculator) {
    if (lastSumCalculator) {
      lastSumCalculator.stop();
      lastSumCalculator = null;
    }

    lastSumCalculator = sumCalculator;
    lastSumCalculator.evaluateBoundingBox();
    boundingBox = lastSumCalculator.getBoundingBox();

    lastSumCalculator.run(onFrame);
  }

  function onFrame(points) {
    drawPoints(points);
    return true;
  }

  function redrawCurrentPoints() {
    updateSize();
    if (lastSumCalculator) {
      drawPoints(lastSumCalculator.getPoints());
    }
  }

  function updateSize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  function drawPoints(points) {
    lastPoints = points;
    ctx.beginPath();
    ctx.fillStyle = fillColor;
    ctx.clearRect(0, 0, width, height);
    ctx.stroke();

    ctx.save();

    ctx.setTransform(
      transformMatrix.scale,
      0,
      0,
      transformMatrix.scale,
      transformMatrix.dx,
      transformMatrix.dy
    );
    ctx.lineWidth = 1 / transformMatrix.scale;
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    const { minX, minY, maxX, maxY } = boundingBox;
    const dx = maxX - minX;
    const dy = maxY - minY;
    const scale = Math.max(dx, dy);

    points.forEach((pt, index) => {
      // let pt = transform(point);
      if (index) {
        ctx.lineTo(
          (pt.x - minX - dx / 2) / scale,
          1 - (pt.y - minY - dy / 2) / scale
        );
      } else {
        ctx.moveTo(
          (pt.x - minX - dx / 2) / scale,
          1 - (pt.y - minY - dy / 2) / scale
        );
      }
    });
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }

  function canvasController(canvas, transform) {
    var controller = {
      applyTransform(newT) {
        var pixelRatio = 1; // scene.getPixelRatio();

        transform.dx = newT.x * pixelRatio;
        transform.dy = newT.y * pixelRatio;
        transform.scale = newT.scale;
        transform.dirty = true;
        if (lastSumCalculator && lastSumCalculator.isDone()) {
          // todo remove this.
          drawPoints(lastPoints);
        }
        // scene.renderFrame()
      },

      getOwner() {
        return canvas;
      }
    };
    return controller;
  }
};
