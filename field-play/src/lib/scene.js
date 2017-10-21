/**
 * This file is based on https://github.com/mapbox/webgl-wind
 * by Vladimir Agafonkin
 * 
 * Released under ISC License, Copyright (c) 2016, Mapbox
 * https://github.com/mapbox/webgl-wind/blob/master/LICENSE
 * 
 * Adapted to field maps by Andrei Kashcha
 * Copyright (C) 2017
 */
import util from './gl-utils';
import makePanzoom from 'panzoom';
import bus from './bus';
import appState from './appState';
import wglPanZoom from './wglPanZoom';
import getParsedVectorFieldFunction from './utils/getParsedVectorFieldFunction';

import createDrawParticlesProgram from './programs/drawParticlesProgram';

export default initScene;

const NO_TRANSFORM = {dx: 0, dy: 0, scale: 1};

function initScene(gl) {
  // Canvas size management
  var canvasRect = { width: 0, height: 0, top: 0, left: 0 };
  setWidthHeight(gl.canvas.width, gl.canvas.height);
  window.addEventListener('resize', onResize, true);

  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.STENCIL_TEST); 
    
  // Video capturing is available in super advanced mode. You'll need to install
  // and start https://github.com/greggman/ffmpegserver.js 
  // Then type in the console: window.startRecord();
  // This will trigger frame-by-frame recording (it is slow). To stop it, call window.stopRecord();
  bus.on('start-record', startRecord);
  bus.on('stop-record', stopRecord);
  var currentCapturer = null;

  // TODO: It feels like bounding box management needs to be moved out from here.
  var boundingBoxUpdated = false;
  var bbox = appState.getBBox() || {};
  var currentPanZoomTransform = {
    scale: 1,
    x: 0,
    y: 0
  };
  var lastBbox = null;

  // How quickly we should fade previous frame (from 0..1)
  var fadeOpacity = appState.getFadeout();
  // How many particles do we want?
  var particleCount = appState.getParticleCount();
  // What is the current code?
  var currentVectorFieldCode = appState.getCode();

  // TODO: Remove local variables in favour of context.
  var ctx = {
    gl,
    bbox,

    framebuffer: gl.createFramebuffer(),
    quadBuffer: util.createBuffer(gl, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])),

    colorMode: appState.getColorMode(),

    integrationTimeStep: appState.getIntegrationTimeStep(),

    // On each frame the likelihood for a particle to reset its position is this:
    dropProbability: appState.getDropProbability(),

    // current frame number. Reset every time when new shader is compiled
    frame: 0,

    // Texture size to store particles' positions
    particleStateResolution: 0,
  };

  var isPaused = false;

  // TODO: Read from query state?
  let backgroundColor;
  setBackgroundColor({ r: 19, g: 41, b: 79, a: 1 });
  
  // screen rendering;
  var screenTexture, backgroundTexture;
  var boundBoxTextureTransform = {dx: 0, dy: 0, scale: 1};
  updateScreenTextures();

  // TODO: Clean up
  var screenProgram = util.createProgram(gl, `
  // screen program
precision highp float;

attribute vec2 a_pos;
varying vec2 v_tex_pos;
uniform vec3 u_transform;

void main() {
    v_tex_pos = a_pos;
    vec2 pos = a_pos;
    pos.x = (pos.x - 0.5) / u_transform.z - u_transform.x + 0.5 * u_transform.z;
    pos.y = pos.y / u_transform.z + u_transform.y;
    pos = 1.0 - 2.0 * pos;
    gl_Position = vec4(pos, 0, 1);
}`, `precision highp float;
uniform sampler2D u_screen;
uniform float u_opacity;
uniform float u_opacity_border;

varying vec2 v_tex_pos;

void main() {
  vec2 p = 1.0 - v_tex_pos;
  vec4 color = texture2D(u_screen, p);

  // For some reason particles near border leave trace when we translate the texture
  // This is my dirty hack to fix it: https://computergraphics.stackexchange.com/questions/5754/fading-particles-and-transition
  if (p.x < u_opacity_border || p.x > 1. - u_opacity_border || p.y < u_opacity_border || p.y > 1. - u_opacity_border) {
    gl_FragColor = vec4(0.);
  } else {
    // opacity fade out even with a value close to 0.0
    gl_FragColor = vec4(floor(255.0 * color * u_opacity) / 255.0);
  }
}`);
  var drawProgram = createDrawParticlesProgram(ctx);

  loadCodeFromAppState();

  // particles
  var lastAnimationFrame;

  initParticles(particleCount);

  var api = {
    start: nextFrame,
    stop,
    dispose,
    reset,

    setPaused,

    updateVectorField,
    getCurrentCode,

    getParticlesCount,
    setParticlesCount,

    setFadeOutSpeed,
    getFadeOutSpeed,

    setDropProbability,
    getDropProbability,

    setBackgroundColor,
    getBackgroundColor,

    getIntegrationTimeStep,
    setIntegrationTimeStep,

    setColorMode,
    getColorMode,

    getCanvasRect() {
      // We trust they don't do anything bad with this ...
      return canvasRect;
    }
  }

  var panzoom = initPanzoom(); 
  restoreBBox();

  setTimeout(() => {
    bus.fire('scene-ready', api);
  })

  return api;

  function startRecord(capturer) {
    currentCapturer = capturer;
  }

  function stopRecord() {
    currentCapturer = null;
  }

  function setColorMode(x) {
    var mode = parseInt(x, 10);
    drawProgram.updateColorMode(mode);
    appState.setColorMode(mode);
    ctx.currentColorMode = mode;
  }

  function getColorMode() {
    return appState.getColorMode();
  }

  function getIntegrationTimeStep() {
    return appState.getIntegrationTimeStep();
  }

  function setIntegrationTimeStep(x) {
    var f = parseFloat(x);
    if (Number.isFinite(f)) {
      ctx.integrationTimeStep = f;
      appState.setIntegrationTimeStep(f);
      bus.fire('integration-timestep-changed', f);
    }
  }

  function setPaused(shouldPause) {
    isPaused = shouldPause;
    nextFrame();
  }

  function setBackgroundColor(newBackground) {
    backgroundColor = newBackground;
    let {r, g, b, a} = backgroundColor;
    document.body.style.background = `rgba(${r}, ${g}, ${b}, ${a})`
  }

  function getBackgroundColor() {
    return backgroundColor;
  }

  // Main screen fade out configuration
  function setFadeOutSpeed(x) {
    var f = parseFloat(x);
    if (Number.isFinite(f)) {
      fadeOpacity = f;
      appState.setFadeout(f);
    }
  }

  function getFadeOutSpeed() {
    return appState.getFadeout();
  }

  // Number of particles configuration
  function getParticlesCount() {
    return appState.getParticleCount();
  }

  function setParticlesCount(newParticleCount) {
    if (!Number.isFinite(newParticleCount)) return;
    if (newParticleCount === particleCount) return;
    if (newParticleCount < 1) return;

    initParticles(newParticleCount);
    particleCount = newParticleCount;
    appState.setParticleCount(newParticleCount);
  }

  // drop probability
  function setDropProbability(x) {
    var f = parseFloat(x);
    if (Number.isFinite(f)) {
      // TODO: Do I need to worry about duplication/clamping?
      appState.setDropProbability(f);
      ctx.dropProbability = f;
    }
  }

  function getDropProbability() {
    return appState.getDropProbability();
  }

  // current code;
  function getCurrentCode() {
    return appState.getCode();
  }

  function loadCodeFromAppState() {
    let persistedCode = appState.getCode();
    if (persistedCode) {
      let result = trySetNewCode(persistedCode);
      if (!result) return; // This means we set correctly;
      // If we get here - something went wrong. see the console
      console.error('Failed to restore previous vector field: ', result.error);
    }
    // we either failed or we want a default vector field
    trySetNewCode(appState.getDefaultCode());
  }

  function updateVectorField(vectorFieldCode) {
    if (vectorFieldCode === currentVectorFieldCode) return;

    let result = trySetNewCode(vectorFieldCode);
    if (result && result.error) return result;

    currentVectorFieldCode = vectorFieldCode;
    appState.saveCode(vectorFieldCode);
  }

  function trySetNewCode(vectorFieldCode) {
    // step 1 - run through parser
    var parserResult = getParsedVectorFieldFunction(vectorFieldCode);

    if (parserResult.error) {
      return parserResult.error;
    }

    // step 2 - run through real webgl
    try {
      drawProgram.updateCode(parserResult.code);
    } catch (e) {
      return {
        error: e.message
      };
    }
  }

  function updateScreenTextures() {
    var {width, height} = canvasRect;
    var emptyPixels = new Uint8Array(width * height * 4);
    if (screenTexture) {
      gl.deleteTexture(screenTexture);
    }
    if (backgroundTexture) {
      gl.deleteTexture(backgroundTexture);
    }

    screenTexture = util.createTexture(gl, gl.NEAREST, emptyPixels, width, height);
    backgroundTexture = util.createTexture(gl, gl.NEAREST, emptyPixels, width, height);
  }

  function onResize() {
    setWidthHeight(window.innerWidth, window.innerHeight);

    updateScreenTextures();
    updateBoundingBox(currentPanZoomTransform);
  }

  function setWidthHeight(w, h) {
    var dx = Math.max(w * 0.02, 30);
    var dy = Math.max(h * 0.02, 30);
    canvasRect.width = w + 2 * dx;
    canvasRect.height = h + 2 * dy;
    canvasRect.top = - dy;
    canvasRect.left = - dx;


    let canvas = gl.canvas;
    canvas.width = canvasRect.width;
    canvas.height = canvasRect.height;
    canvas.style.left = (-dx) + 'px';
    canvas.style.top = (-dy) + 'px';
  }

  function dispose() {
      stop();
      panzoom.dispose();
      window.removeEventListener('resize', onResize, true);
  }

  function nextFrame() {
    if (lastAnimationFrame) return;

    if (isPaused) return;

    lastAnimationFrame = requestAnimationFrame(draw);
  }

  function stop() {
    cancelAnimationFrame(lastAnimationFrame);
    lastAnimationFrame = 0;
  }

  function draw() {
    lastAnimationFrame = 0;
    drawScreen();
    drawProgram.onUpdateParticles();

    if (currentCapturer) currentCapturer.capture(gl.canvas);

    nextFrame();
  }

  function drawScreen() {
    // render to the frame buffer
    util.bindFramebuffer(gl, ctx.framebuffer, screenTexture);
    gl.viewport(0, 0, canvasRect.width, canvasRect.height);

    if (boundingBoxUpdated && lastBbox) {
      // We move the back texture, relative to the bounding box change. This eliminates
      // particle train artifacts, though, not all of them: https://computergraphics.stackexchange.com/questions/5754/fading-particles-and-transition
      // If you know how to improve this - please let me know.
      boundBoxTextureTransform.dx = -(ctx.bbox.minX - lastBbox.minX)/(ctx.bbox.maxX - ctx.bbox.minX);
      boundBoxTextureTransform.dy = -(ctx.bbox.minY - lastBbox.minY)/(ctx.bbox.maxY - ctx.bbox.minY);
      boundBoxTextureTransform.scale = (ctx.bbox.maxX - ctx.bbox.minX) / (lastBbox.maxX - lastBbox.minX);
      drawTexture(backgroundTexture, fadeOpacity, boundBoxTextureTransform);
    } else {
      drawTexture(backgroundTexture, fadeOpacity, NO_TRANSFORM)
    }

    drawProgram.drawParticles();

    util.bindFramebuffer(gl, null);

    saveLastBbox();

    gl.enable(gl.BLEND); 
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(backgroundColor.r/255, backgroundColor.g/255, backgroundColor.b/255, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawTexture(screenTexture, 1.0, NO_TRANSFORM);
    gl.disable(gl.BLEND);

    var temp = backgroundTexture;
    backgroundTexture = screenTexture;
    screenTexture = temp;
    boundingBoxUpdated = false;
  }

  function drawTexture(texture, opacity, textureTransform) {
    var program = screenProgram;
    gl.useProgram(program.program);
    util.bindAttribute(gl, ctx.quadBuffer, program.a_pos, 2);
    util.bindTexture(gl, texture, 2);

    gl.uniform1f(program.u_opacity_border, 0.02);
    gl.uniform1i(program.u_screen, 2);
    gl.uniform1f(program.u_opacity, opacity);
    gl.uniform3f(program.u_transform, textureTransform.dx, textureTransform.dy, textureTransform.scale);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function saveLastBbox() {
    if (!lastBbox) lastBbox = {};

    lastBbox.minX = ctx.bbox.minX;
    lastBbox.minY = ctx.bbox.minY;
    lastBbox.maxX = ctx.bbox.maxX;
    lastBbox.maxY = ctx.bbox.maxY;
  }

  function initParticles(numParticles) {
    // we create a square texture where each pixel will hold a particle position encoded as RGBA
    ctx.particleStateResolution = Math.ceil(Math.sqrt(numParticles));
    drawProgram.onParticleInit();
  }

  function initPanzoom() {
    let initializedPanzoom = makePanzoom(gl.canvas, {
      zoomSpeed: 0.025,
      controller: wglPanZoom(gl.canvas, updateBoundingBox)
    });

    return initializedPanzoom;
  }

  function restoreBBox() {
    var savedBBox = appState.getBBox();
    var {width, height} = canvasRect;

    let sX = Math.PI * Math.E;
    let sY = Math.PI * Math.E;
    let tX = 0;
    let tY = 0;
    if (savedBBox) {
      sX = savedBBox.maxX - savedBBox.minX;
      sY = savedBBox.maxY - savedBBox.minY;
      // TODO: Not sure if this is really the best way to do it.
      var ar = width/height;
      tX = width * (savedBBox.minX + savedBBox.maxX)/2;
      tY = height * (savedBBox.minY + savedBBox.maxY)/2*ar;
    }

    var w2 = sX * width/2;
    var h2 = sY * height/2;
    panzoom.showRectangle({
      left: -w2 + tX,
      top: -h2 - tY,
      right: w2 + tX,
      bottom: h2 - tY ,
    });
  }

  function updateBoundingBox(transform) {
    boundingBoxUpdated = true;
    currentPanZoomTransform.x = transform.x;
    currentPanZoomTransform.y = transform.y;
    currentPanZoomTransform.scale = transform.scale;

    var {width, height} = canvasRect;

    var minX = clientX(0);
    var minY = clientY(0);
    var maxX = clientX(width);
    var maxY = clientY(height);

    var ar = width/height;
    bbox.minX = minX/width;
    bbox.minY =  -minY/height / ar;
    bbox.maxX = maxX/width;
    bbox.maxY =  -maxY/height / ar;


    appState.saveBBox(bbox);

    bus.fire('bbox-change', bbox);

    function clientX(x) {
      return (x - transform.x)/transform.scale;
    }

    function clientY(y) {
      return (y - transform.y)/transform.scale;
    }
  }

  function reset() {
    var w = canvasRect.width/2;
    var h = canvasRect.height/2;

    appState.saveBBox({
      minX: -w,
      minY: -h,
      maxX: w,
      maxY: h
    }, /* immediate = */ true);
    restoreBBox();
    // a hack to trigger panzoom event
    panzoom.moveBy(0, 0, false);
  }
}