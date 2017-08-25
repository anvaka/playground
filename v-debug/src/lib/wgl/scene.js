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

  var api = {
    appendChild,
    setViewBox,
    dispose,
  };

  var frameToken = requestAnimationFrame(frame);

  return api;

  function dispose() {
    panzoom.dispose();
    sceneRoot.dispose();
    if (frameToken) {
      cancelAnimationFrame(frameToken)
      frameToken = null;
    }
  }

  function setViewBox(rect) {
    panzoom.showRectangle(rect)
  }

  function frame() {
    gl.clear(gl.COLOR_BUFFER_BIT)
    sceneRoot.updateWorldTransform();

    sceneRoot.draw(gl, screen);
    frameToken = requestAnimationFrame(frame);
  }

  function appendChild(object) {
    sceneRoot.appendChild(object);
  }
}

function wglPanZoom(canvas, sceneRoot) {
  return {
      applyTransform(newT) {
        var transform = sceneRoot.transform;
        transform.dx = newT.x;
        transform.dy = newT.y; 
        transform.scale = newT.scale;
        sceneRoot.worldTransformNeedsUpdate = true;
      },

      getOwner() {
        return canvas
      }
    }
}