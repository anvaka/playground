var makePanzoom = require('panzoom');
var createFractalCodeState = require('./editor/fractalCodeState');
var config = require('./config.js');
var bus = require('./bus');
var util = require('./util/gl-utils');
var createShaders = require('./util/createShaders');
var appState = require('./appState');

module.exports = initScene;

function initScene(canvas) {
  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    throw new Error('WebGL is not available');
  }

  var panzoom = makePanzoom(gl.canvas, {
    realPinch: true,
    zoomSpeed: 0.035,
    controller: {
      applyTransform,
      getOwner() { return gl.canvas; },
    }
  });

  var sceneTransform = {x: 0, y: 0, z: 1};
  var sceneWidth = canvas.clientWidth;
  var sceneHeight = canvas.clientHeight;

  var requestSizeUpdate = true;
  var requestTransformUpdate = true;
  var currentFrameNumber = 0;
  
  restorePanzoom();
  var shader = createShaders(appState.getCode());

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  var screenProgram = util.createProgram(gl, shader.vertexShader, shader.fragmentShader);
  var quadBuffer = util.createBuffer(gl, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]));
  util.bindAttribute(gl, quadBuffer, screenProgram.a_pos, 2);

  listenToEvents();

  var fractalEditorState = createFractalCodeState(updateCode);

  var state = {
    sidebarOpen: !config.isSmallScreen(),
    fractalEditorState,
    dispose
  }

  window.scene = state;

  var nextAnimationFrame = requestAnimationFrame(animate);

  return state;

  function animate() {
    nextAnimationFrame = 0;
    drawCurrentFrame();
    currentFrameNumber += 1;
    scheduleNextFrame();
  }

  function updateCode(parserResult) {
    var updateProgram = util.createProgram(gl, shader.vertexShader, parserResult.code);
    if (screenProgram) {
      screenProgram.unload();
    }
    screenProgram = updateProgram;
    // quadBuffer = util.createBuffer(gl, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]));
    util.bindAttribute(gl, quadBuffer, screenProgram.a_pos, 2);
    requestSizeUpdate = true;
    requestTransformUpdate = true;

    bus.fire('scene-ready', window.scene);
  }

  function scheduleNextFrame() {
    if (nextAnimationFrame) return;
    nextAnimationFrame = requestAnimationFrame(animate);
  }

  function drawCurrentFrame() {
    gl.useProgram(screenProgram.program); 

    if (requestSizeUpdate) {
      requestSizeUpdate = false;
      gl.viewport(0, 0, sceneWidth, sceneHeight);
      gl.uniform2f(screenProgram.u_resolution, sceneWidth, sceneHeight);
    }
    if (requestTransformUpdate) {
      requestTransformUpdate = false;
      gl.uniform3f(screenProgram.u_transform, sceneTransform.x, sceneTransform.y, sceneTransform.z);
    }

    gl.uniform1f(screenProgram.u_frame, currentFrameNumber);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function applyTransform(newTransform) {
    var tx = newTransform.x/sceneWidth;
    var ty = newTransform.y/sceneHeight;
    var scale = newTransform.scale;

    sceneTransform.x = (tx * 2 - 1)/scale;
    sceneTransform.y = (ty * 2 - 1)/scale;
    sceneTransform.z = scale;
    requestTransformUpdate = true;
    appState.saveTransform(tx, ty, scale);
    scheduleNextFrame();
  }

  function restorePanzoom() {
    panzoom.showRectangle(appState.getVisibleRectangle(sceneWidth, sceneHeight));
  }

  function dispose() {
    panzoom.dispose();

    window.removeEventListener('resize', updateSize);
    cancelAnimationFrame(nextAnimationFrame);
    nextAnimationFrame = 0;
  }

  function listenToEvents() {
    window.addEventListener('resize', updateSize);
  }

  function updateSize() {
    // var sideBarWidthOffset = (!state.sidebarOpen || config.isSmallScreen ()) ? 0: config.sidebarWidth;
    // var sideBarHeightOffset = config.isSmallScreen() ? config.sidebarHeight : 0;
    // setSceneSize(window.innerWidth - sideBarWidthOffset, window.innerHeight - sideBarHeightOffset);
    setSceneSize(window.innerWidth, window.innerHeight);
  }

  function setSceneSize(width, height) {
    canvas.width = width;
    canvas.height = height;
    sceneWidth = width;
    sceneHeight = height;

    requestSizeUpdate = true;
    scheduleNextFrame();
  }
}