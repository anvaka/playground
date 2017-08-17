const makePanzoom = require('panzoom');
const Element = require('./Element');

// const makeLineProgram = require('./lines.js');

module.exports = makeScene;

function makeScene(canvas) {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.BLEND);
  gl.clearColor(0, 0, 0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.viewport(0, 0, canvas.offsetWidth, canvas.offsetHeight);
  
  var sceneRoot = new Element();
  var screen = {
    width: canvas.width,
    height: canvas.height,
  };

  var panzoom = makePanzoom(canvas, {
    controller: wglPanZoom(canvas, sceneRoot)
  });
//  var nodeProgram = makeNodeProgram(gl, nodesData, screen)

  // var linesCount = nodeCount * (nodeCount - 1);
  // var itemsPerLine = 2 + 2;
  // var lines = new Float32Array(linesCount * itemsPerLine);
  // for (var i = 0; i < nodeCount; ++i) {
  //   for (var j = 0; j < nodeCount; ++j) {
  //     if (i === j) continue

  //     var offset = (i * nodeCount + j) * itemsPerLine;
  //     var from = i * itemsPerNode;
  //     var to = j * itemsPerNode;
  //     lines[offset + 0] = nodesData[from + 0];
  //     lines[offset + 1] = nodesData[from + 1];
  //     lines[offset + 2] = nodesData[to + 0];
  //     lines[offset + 3] = nodesData[to + 1];
  //   }
  // }

  // var lineProgram = makeLineProgram(gl, lines, screen)

  // nodeProgram.draw();
  // lineProgram.draw();

  var api = {
    add,
    showRectangle
  };

  requestAnimationFrame(frame);
  return api;

  function showRectangle(rect) {
    panzoom.showRectangle(rect)
  }

  function frame() {
    gl.clear(gl.COLOR_BUFFER_BIT)
    sceneRoot.updateWorldTransform();

    sceneRoot.draw(gl, screen);
    requestAnimationFrame(frame);
  }

  function add(object) {
    sceneRoot.appendChild(object);
  }
}

function wglPanZoom(canvas, sceneRoot) {
  return {
      applyTransform(newT) {
        var width = canvas.width
        var height = canvas.height
        var transform = sceneRoot.transform;

        transform.dx = (2 * newT.x / width) - 1;
        transform.dy = 1 - (2 * newT.y / height);

        transform.scale = newT.scale;
        sceneRoot.worldTransformNeedsUpdate = true;
      },

      getOwner() {
        return canvas
      }
    }
}