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
import shaders from './sharders';
import makePanzoom from 'panzoom';
import bus from './bus';
import appState from './appState';

export default initScene;

var defaultVectorField = `v.x = -p.y;
v.y = p.x;
`;

function initScene(gl, particlesCount = 10000) {
  let fadeOpacity = .9998;
  let pixelRatio = 1.0; // scene.getPixelRatio(); // TODO?
  window.addEventListener('resize', onResize, true);

  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.STENCIL_TEST); 
  var bbox = {
    minX: -1,
    minY: -1,
    maxX: 1,
    maxY: 1,
  };
  var transform = {
    scale: 1,
    dx: 0,
    dy: 0
  };

  var isPaused = false;
  var framebuffer = gl.createFramebuffer();
  var quadBuffer = util.createBuffer(gl, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]));
  
  // screen rendering;
  var screenTexture, backgroundTexture;
  updateScreenTextures();

  var screenProgram = util.createProgram(gl, shaders.quadVert, shaders.screenFrag);
  var drawProgram = util.createProgram(gl, shaders.drawVert, shaders.drawFrag);

  // On each frame the likelihood for a particle to reset its position is this:
  var dropProbabilty = 0.009;

  var currentCode = '';
  var updateProgram;
  loadUpdateProgramFromAppState();

  // particles
  var particleStateResolution, _numParticles, particleStateTexture0, particleStateTexture1, particleIndices, particleIndexBuffer;
  var lastAnimationFrame;

  initParticles(particlesCount);

  var api = {
    start: nextFrame,
    stop,
    dispose,
    transform,

    setPaused,

    updateVectorField,
    getCurrentCode,

    getParticlesCount,
    setParticlesCount,

    setFadeOutSpeed,
    getFadeOutSpeed,

    setDropProbability,
    getDropProbability
  }

  var panzoom = initPanzoom(); 
  setTimeout(() => {
    bus.fire('scene-ready', api);
  })

  return api;

  function setPaused(shouldPause) {
    isPaused = shouldPause;
    nextFrame();
  }

  // Main screen fade out configuration
  function setFadeOutSpeed(x) {
    var f = parseFloat(x);
    if (Number.isFinite(f)) {
      fadeOpacity = f;
    }
  }

  function getFadeOutSpeed() {
    return fadeOpacity;
  }

  // Number of particles configuration
  function getParticlesCount() {
    return particlesCount;
  }

  function setParticlesCount(newParticlesCount) {
    if (!Number.isFinite(newParticlesCount)) return;
    if (newParticlesCount === particlesCount) return;
    if (newParticlesCount < 1) return;

    initParticles(newParticlesCount);
    particlesCount = newParticlesCount;
  }

  // drop probability
  function setDropProbability(x) {
    var f = parseFloat(x);
    if (Number.isFinite(f)) dropProbabilty = f;
  }

  function getDropProbability() {
    return dropProbabilty;
  }

  // current code;
  function getCurrentCode() {
    return currentCode;
  }

  function loadUpdateProgramFromAppState() {
    let persistedCode = appState.getCode();
    if (persistedCode) {
      let result = trySetNewCode(persistedCode);
      if (!result) return; // This means we set correctly;
      console.error('Failed to restore previous vector field: ', result.error);
    }
    // Iw we get here - something went wrong. see the console
    trySetNewCode(defaultVectorField);
  }

  function updateVectorField(vfCode) {
    let result = trySetNewCode(vfCode);
    if (result && result.error) return result;

    appState.saveCode(vfCode);
  }

  function trySetNewCode(vfCode) {
    try {
      let updateFrag = shaders.unsafeBuildShader(vfCode)

      // TODO: maybe use https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/shaderSource ?
      let newProgram = util.createProgram(gl, shaders.quadVert, updateFrag);
      if (updateProgram) updateProgram.unload();

      updateProgram = newProgram;
      currentCode = vfCode;
    } catch (e) {
      return {
        error: e.message
      };
    }
  }

  function updateScreenTextures() {
    var width = gl.canvas.width; 
    var height = gl.canvas.height;
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
    let canvas = gl.canvas;
    canvas.width = window.innerWidth * pixelRatio;
    canvas.height = window.innerHeight * pixelRatio;

    updateScreenTextures();
    updateBBox();
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
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);
    
    util.bindTexture(gl, particleStateTexture0, 1);
    
    drawScreen();
    updateParticles();

    nextFrame();
  }

  function drawScreen() {
    // render to the frame buffer
    util.bindFramebuffer(gl, framebuffer, screenTexture);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
    drawTexture(backgroundTexture, fadeOpacity)
    drawParticles()
    util.bindFramebuffer(gl, null);
  
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    drawTexture(screenTexture, 1.0);
    gl.disable(gl.BLEND);
  
    // swap textures
    var temp = backgroundTexture;
    backgroundTexture = screenTexture;
    screenTexture = temp;
  }

  function updateParticles() {
    util.bindFramebuffer(gl, framebuffer, particleStateTexture1);
    gl.viewport(0, 0, particleStateResolution, particleStateResolution);
  
    var program = updateProgram;
    gl.useProgram(program.program);
  
    util.bindAttribute(gl, quadBuffer, program.a_pos, 2);
  
    gl.uniform1i(program.u_particles, 1);
  
    gl.uniform1f(program.u_rand_seed, Math.random());
    gl.uniform2f(program.u_min, bbox.minX, bbox.minY);
    gl.uniform2f(program.u_max, bbox.maxX, bbox.maxY);

    gl.uniform1f(program.u_drop_rate, dropProbabilty);
  
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  
    // swap the particle state textures so the new one becomes the current one
    var temp = particleStateTexture0;
    particleStateTexture0 = particleStateTexture1;
    particleStateTexture1 = temp;
  }

  function drawParticles() {
    util.bindTexture(gl, particleStateTexture0, 1);
  
    var program = drawProgram;
    gl.useProgram(program.program);
  
    util.bindAttribute(gl, particleIndexBuffer, program.a_index, 1);
  //   util.bindTexture(gl, this.colorRampTexture, 2);
  
    gl.uniform1i(program.u_particles, 1);
  //   gl.uniform1i(program.u_color_ramp, 2);
  
    gl.uniform1f(program.u_particles_res, particleStateResolution);
  
    gl.drawArrays(gl.POINTS, 0, _numParticles); 
  }

  function drawTexture(texture, opacity) {
    var program = screenProgram;
    gl.useProgram(program.program);

    util.bindAttribute(gl, quadBuffer, program.a_pos, 2);
    util.bindTexture(gl, texture, 2);
    gl.uniform1i(program.u_screen, 2);
    gl.uniform1f(program.u_opacity, opacity);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  
  function initParticles(numParticles) {
    // we create a square texture where each pixel will hold a particle position encoded as RGBA
    var particleRes = Math.ceil(Math.sqrt(numParticles));
    particleStateResolution = particleRes;
    _numParticles = particleRes * particleRes;

    particleIndices = new Float32Array(_numParticles);
    var particleState = new Uint8Array(_numParticles * 4);

    for (var i = 0; i < particleState.length; i++) {
      particleState[i] =  Math.floor(Math.random() * 256); // randomize the initial particle positions
      particleIndices[i] = i;
    }
    
    // textures to hold the particle state for the current and the next frame
    if (particleStateTexture0) gl.deleteTexture(particleStateTexture0);
    particleStateTexture0 = util.createTexture(gl, gl.NEAREST, particleState, particleRes, particleRes);
    if (particleStateTexture1) gl.deleteTexture(particleStateTexture1);
    particleStateTexture1 = util.createTexture(gl, gl.NEAREST, particleState, particleRes, particleRes);

    if (particleIndexBuffer) gl.deleteBuffer(particleIndexBuffer);
    particleIndexBuffer = util.createBuffer(gl, particleIndices);
  }

  function initPanzoom() {
    let initializedPanzoom = makePanzoom(gl.canvas, {
      zoomSpeed: 0.025,
      controller: wglPanZoom(gl.canvas, transform, api)
    });
    let savedBBox = appState.getBBox();

    let sX = Math.PI * Math.E;
    let sY = Math.PI * Math.E;
    let tX = 0;
    let tY = 0;
    if (savedBBox) {

      sX = savedBBox.maxX - savedBBox.minX;
      sY = savedBBox.maxY - savedBBox.minY;
      // TODO: Not sure if this is really the best way to do it.
      var ar = window.innerWidth/window.innerHeight;
      tX = window.innerWidth * (savedBBox.minX + savedBBox.maxX)/2;
      tY = window.innerHeight * (savedBBox.minY + savedBBox.maxY)/2*ar;
    }

    var w2 = sX * window.innerWidth/2;
    var h2 = sY * window.innerHeight/2;
    initializedPanzoom.showRectangle({
      left: -w2 + tX,
      top: -h2 - tY,
      right: w2 + tX,
      bottom: h2 - tY ,
    });
    return initializedPanzoom;
  }

  function updateBBox() {
    var tx = transform.dx;
    var ty = transform.dy;
    var s = transform.scale;
    var w = window.innerWidth;
    var h = window.innerHeight;

    var minX = clientX(0);
    var minY = clientY(0);
    var maxX = clientX(w);
    var maxY = clientY(h);

    var ar = w/h;
    bbox.minX = minX/w
    bbox.minY =  -minY/h / ar
    bbox.maxX = maxX/w
    bbox.maxY =  -maxY/h / ar

    appState.saveBBox(bbox);
    bus.fire('bbox-change', bbox);

    function clientX(x) {
      return (x - tx)/s;
    }

    function clientY(y) {
      return (y - ty)/s;
    }
  }


  function wglPanZoom(canvas, transform/*, scene */) {
    return {
      applyTransform(newT) {
        transform.dx = newT.x * pixelRatio;
        transform.dy = newT.y * pixelRatio; 
        transform.scale = newT.scale;
        updateBBox();
      },

      getOwner() {
        return canvas
      }
    };
  }
}