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
    add,
    setViewBox,
    dispose,
  };

  requestAnimationFrame(frame);

  return api;

  function dispose() {
    panzoom.dispose();
    
    if (gl.getExtension('WEBGL_lose_context')) {
      gl.getExtension('WEBGL_lose_context').loseContext();
    }
  }

  function setViewBox(rect) {
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