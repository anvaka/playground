const makePanzoom = require('panzoom');
const BBox = require('./BBox');
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
  sceneRoot.bbox.minX = -1000;
  sceneRoot.bbox.minY = -1000;
  sceneRoot.bbox.maxX = 1000;
  sceneRoot.bbox.maxY = 1000;
  var screen = {
    width: canvas.width,
    height: canvas.height,
  };

  var panzoom = makePanzoom(canvas, {
    autocenter: true,
    bounds: true,
    controller: wglPanZoom(canvas, sceneRoot.bbox, sceneRoot.transform)
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
    add
  };

  requestAnimationFrame(frame);
  return api;

  function frame() {
    gl.clear(gl.COLOR_BUFFER_BIT)
    sceneRoot.draw(gl, screen);
    requestAnimationFrame(frame);
  }

  function add(object) {
    sceneRoot.appendChild(object);
  }
}

function wglPanZoom(canvas, bbox, transform) {
  return {
      getBBox() {
        return bbox 
      },

      applyTransform(newT) {
        var width = canvas.width
        var height = canvas.height

        transform.dx = (2 * newT.x / width) - 1;
        transform.dy = 1 - (2 * newT.y / height);

        transform.scale = newT.scale
      },

      getOwner() {
        return canvas
      }
    }
}