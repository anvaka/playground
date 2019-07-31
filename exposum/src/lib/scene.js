const panzoom = require('panzoom');
const wgl = require('w-gl');

module.exports = function createScene() {
  var lastSumCalculator;
  var transformMatrix = {};
  var width, height;
  var canvas = document.getElementById('scene-canvas');
  updateSize();

  var webGLScene = wgl.scene(canvas, {
      size: {
        width,
        height
      }
  });
  webGLScene.setClearColor(12/255, 41/255, 82/255, 1)
  webGLScene.setPixelRatio(1);

  let initialSceneSize = 10;
  webGLScene.setViewBox({
    left:  -initialSceneSize,
    top:   -initialSceneSize,
    right:  initialSceneSize,
    bottom: initialSceneSize,
  })
  let lines; // = new wgl.WireCollection(10);
  // lines.add({
  //   from: { x: 0, y: 0 },
  //   to: { x: 10, y: 10 }
  // })
  // lines.add({
  //   from: { x: 0, y: 0 },
  //   to: { x: 10, y: 0 }
  // })
  // webGLScene.appendChild(lines);

  // var zoomer = panzoom(canvas, {
  //   controller: canvasController(canvas, transformMatrix)
  // });

  // var ctx = canvas.getContext('2d');
  var lineColor = 'rgba(255, 255, 255, 0.6)';
  var fillColor = 'rgba(27, 41, 74, 1.0)';
  var lastPoints, lastPoint;
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
      lastPoint = null;
    }

    lastSumCalculator = sumCalculator;
    lastSumCalculator.evaluateBoundingBox();
    boundingBox = lastSumCalculator.getBoundingBox();
    let options = lastSumCalculator.getOptions();
    if (lines) {
      webGLScene.removeChild(lines);
    }
    lines = new wgl.WireCollection(options.totalSteps);
    webGLScene.appendChild(lines);
    lastSumCalculator.run(onFrame);
  }

  function onFrame(points, newPoints) {
    drawPoints(points, newPoints);
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

  function drawPoints(points, newPoints) {
    // lines.add({
    //   from: { x: 0, y: 0 },
    //   to: { x: 10, y: 0 }
    // })
    let addedPoints
    if (newPoints) {
      newPoints.forEach(point => {
        if (lastPoint) {
          lines.add({
            from: {x: lastPoint.x, y: lastPoint.y},
            to: {x: point.x, y: point.y}
          });
        }
        lastPoint = point
      })
    }

    webGLScene.renderFrame();
    return;
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
