const makePanzoom = require('panzoom');
const Element = require('./Element');
const createTree = require('d3-quadtree').quadtree;

// const makeLineProgram = require('./lines.js');

module.exports = makeScene;

let pixelRatio = 1.0; //window.devicePixelRatio;

function makeScene(canvas) {
  let width;
  let height;
  let screen = { width: 0, height: 0 };

  var sceneRoot = new Element();

  let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  let interactiveTree = createTree();

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.BLEND);
  gl.clearColor(0, 0, 0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT)

  updateCanvasSize();
  
  var lastTreeUpdate = new Date();

  var panzoom = makePanzoom(canvas, {
    controller: wglPanZoom(canvas, sceneRoot)
  });

  var api = {
    appendChild,
    removeChild,
    setViewBox,
    dispose,
  };

  var frameToken = requestAnimationFrame(frame);
  var prevHighlighted, prevColor;
  listenToEvents();

  return api;

  function listenToEvents() {
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onMouseClick);
    window.addEventListener('resize', onResize, true);
  }

  function dispose() {
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('click', onMouseClick);
    window.removeEventListener('resize', onResize, true);

    panzoom.dispose();
    sceneRoot.dispose();
    if (frameToken) {
      cancelAnimationFrame(frameToken);
      frameToken = null;
    }
  }

  function onResize() {
    updateCanvasSize();
  }

  function updateCanvasSize() {
    width = canvas.width = canvas.offsetWidth * pixelRatio
    height = canvas.height = canvas.offsetHeight * pixelRatio
    gl.viewport(0, 0, width, height);

    screen.width = width;
    screen.height = height;
    sceneRoot.worldTransformNeedsUpdate = true;
  }

  function onMouseClick(e) {
  }

  function onMouseMove(e) {
    let t = sceneRoot.transform;
    let canvasX = e.clientX * pixelRatio;
    let canvasY = e.clientY * pixelRatio;
    let x = (canvasX - t.dx)/t.scale;
    let y = (canvasY - t.dy)/t.scale;
    let res = interactiveTree.find(x, y, 10);

    if (res) {
      if (prevHighlighted) {
        prevHighlighted.setColor(prevColor);
      }
      let p = res.p;
      prevColor = {
        r: p.color.r,
        g: p.color.g,
        b: p.color.b
      }
      prevHighlighted = p;
      p.setColor({ r: 1, g: 0, b: 0 })

      console.log(p.data)
    }
  }

  function setViewBox(rect) {
    panzoom.showRectangle(rect)
  }

  function frame() {
    gl.clear(gl.COLOR_BUFFER_BIT)
    let wasDirty = sceneRoot.updateWorldTransform();
    if (wasDirty) {
      updateInteractiveTree();
    }

    sceneRoot.draw(gl, screen);
    frameToken = requestAnimationFrame(frame);
  }

  function updateInteractiveTree() {
    let now = new Date();
    if (now - lastTreeUpdate < 500) return; 

    interactiveTree = createTree().x(p => p.x).y(p => p.y);
    sceneRoot.addInteractiveElements(interactiveTree, -sceneRoot.transform.dx, -sceneRoot.transform.dy);

    lastTreeUpdate = new Date();
  }

  function appendChild(child) {
    sceneRoot.appendChild(child);
  }

  function removeChild(child) {
    sceneRoot.removeChild(child)
  }
}

function wglPanZoom(canvas, sceneRoot) {
  return {
      applyTransform(newT) {
        var transform = sceneRoot.transform;
        transform.dx = newT.x * pixelRatio;
        transform.dy = newT.y * pixelRatio; 
        transform.scale = newT.scale;
        sceneRoot.worldTransformNeedsUpdate = true;
      },

      getOwner() {
        return canvas
      }
    }
}