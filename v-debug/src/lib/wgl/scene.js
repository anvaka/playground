const makePanzoom = require('panzoom');
const BBox = require('./BBox')
// const makeLineProgram = require('./lines.js');

module.exports = makeScene;

function makeScene(canvas) {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  let children = [];

  let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.BLEND);
  gl.clearColor(0, 0, 0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.viewport(0, 0, canvas.offsetWidth, canvas.offsetHeight);
  
  var bbox = new BBox();
  bbox.maxX = 1;
  bbox.maxY = 1;
  var transform = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ];


  var screen = {
    width: canvas.width,
    height: canvas.height,
    transform: transform
  };
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
  var running = false;

  return api;

  function frame() {
    gl.clear(gl.COLOR_BUFFER_BIT)
    children.forEach(child => child.draw(gl, screen));
    requestAnimationFrame(frame);
  }

  function add(object) {
    children.push(object);
    if (object.bbox) {
      // TODO: this is fragile, as we wouldn't know when child bbox updates.
      bbox.merge(object.bbox)
    }
    // TODO: this is very fragile. Need to do something better than this.
    if (!running) run()
  }

  function run() {
    running = true;
    makePanzoom(canvas, {
      autocenter: true,
      bounds: true,
      controller: wglPanZoom(canvas, bbox, transform)
    });
    requestAnimationFrame(frame);
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

        transform[12] = (2 * newT.x / width) - 1;
        transform[13] = 1 - (2 * newT.y / height);

        transform[0] = newT.scale
        transform[5] = newT.scale
      },

      getOwner() {
        return canvas
      }
    }
}