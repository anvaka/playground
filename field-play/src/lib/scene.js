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
import shaders from './shaders';
import makePanzoom from 'panzoom';
import bus from './bus';
import appState from './appState';

import createDrawParticlesProgram from './programs/drawParitclesProgram';

// TODO: This is naive parser that is being used before
// main `glsl-parser` is loaded asynchronously. This parser assumes
// there are no errors, but maybe I should be more careful here.
var glslParser = {
  check(/* code */) {
    return {
      log: {
        errorCount: 0
      }
    };
  }
}

// glsl-parser is ~179KB uncompressed, we don't want to wait until it is downloaded.
require.ensure('glsl-parser', () => {
  // Replace naive parser with the real one.
  glslParser = require('glsl-parser');
})

export default initScene;

var defaultVectorField = `v.x = -p.y;
v.y = p.x;
`;

function initScene(gl) {
  let pixelRatio = 1.0; // scene.getPixelRatio(); // TODO?
  let fadeOpacity = appState.getFadeout();
  let particleCount = appState.getParticleCount();
  window.addEventListener('resize', onResize, true);

  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.STENCIL_TEST); 
  var bbox = {
    minX: -1,
    minY: 1,
    maxX: 1,
    maxY: -1,
  };
  var transform = {
    scale: 1,
    dx: 0,
    dy: 0
  };

  // TODO: Remove local variables in favour of context.
  var ctx = {
    gl,
    bbox,
    framebuffer: null,
    colorMode: appState.getColorMode(),
    time: 0
  };
  var isPaused = false;
  var framebuffer = ctx.framebuffer = gl.createFramebuffer();
  var quadBuffer = ctx.quadBuffer = util.createBuffer(gl, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]));
  // On each frame the likelihood for a particle to reset its position is this:
  ctx.dropProbabilty = appState.getDropProbability();

  // TODO: Read from query state?
  let backgroundColor;
  setBackgroundColor({ r: 19, g: 41, b: 79, a: 1 });
  
  // screen rendering;
  var screenTexture, backgroundTexture;
  updateScreenTextures();

  var screenProgram = util.createProgram(gl, shaders.quadVert, shaders.screenFrag);

  var drawProgram = createDrawParticlesProgram(ctx);

  var currentCode = '';
  loadUpdateProgramFromAppState();

  // particles
  var lastAnimationFrame;

  initParticles(particleCount);

  let integrationTimeStep = ctx.integrationTimeStep = appState.getIntegrationTimeStep();

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
    getDropProbability,

    setBackgroundColor,
    getBackgroundColor,

    getIntegrationTimeStep,
    setIntegrationTimeStep,

    setColorMode,
    getColorMode
  }

  var panzoom = initPanzoom(); 
  setTimeout(() => {
    bus.fire('scene-ready', api);
  })

  return api;

  function setColorMode(x) {
    var mode = parseInt(x, 10);
    drawProgram.updateColorMode(mode);
    appState.setColorMode(mode);
    ctx.currentColorMode = mode;
  }

  function getColorMode() {
    return ctx.currentColorMode;
  }

  function getIntegrationTimeStep() {
    return integrationTimeStep;
  }

  function setIntegrationTimeStep(x) {
    var f = parseFloat(x);
    if (Number.isFinite(f)) {
      ctx.integrationTimeStep = integrationTimeStep = f;
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
    return fadeOpacity;
  }

  // Number of particles configuration
  function getParticlesCount() {
    return particleCount;
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
      ctx.dropProbabilty = f;
    }
  }

  function getDropProbability() {
    return ctx.dropProbabilty;
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
    if (vfCode === currentCode) return;

    let result = trySetNewCode(vfCode);
    if (result && result.error) return result;

    appState.saveCode(vfCode);
  }

  function trySetNewCode(vfCode) {
    // step 0 - run through primitive check?
    // step 1 - run through parser
    let res = glslParser.check(`
vec2 velocity(vec2 p) {
vec2 v = vec2(0., 0.);
${vfCode}
return v;
}`, {
  globals: `
import {
  float snoise(vec2 v);
  float u_time;
}
`
});


    if (res.log.errorCount) {
      return parserError(res.log);
    }
    
    // step 2 - run through real webgl
    try {
      drawProgram.updateCode(vfCode);
      currentCode = vfCode;
    } catch (e) {
      return {
        error: e.message
      };
    }
  }

  function parserError(log) {
    let diag = log.diagnostics[0];
    // TODO probably need to check kind (errors ar 0, warnings are 1)
    let firstError = diag.range;
    let lineColumn = firstError.lineColumn();
    let source = firstError.source;
    let offset = source._lineOffsets[lineColumn.line]
    let line = source.contents.substr(offset,  lineColumn.column);
    let prefix = 'Line ' + lineColumn.line + ': ';
    let diagText = diag.text;
    return {
      error: 
        prefix + line + '\n' +
        whitespace(prefix.length) + whitespace(lineColumn.column) + '^',
      errorDetail: diagText,
      isFloatError: isFloatError(diagText)
    };
  }

  function isFloatError(diagText) {
    return diagText.indexOf('"int"') > -1 &&
      diagText.indexOf('"float"')  > -1;
  }

  function whitespace(length) {
    return new Array(length + 1).join(' ');
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
    
    ctx.time += 1;
    drawScreen();
    updateParticles();

    nextFrame();
  }

  function drawScreen() {
    // render to the frame buffer
    util.bindFramebuffer(gl, framebuffer, screenTexture);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
    drawTexture(backgroundTexture, fadeOpacity)

    drawProgram.drawParticles();

    util.bindFramebuffer(gl, null);
  
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    drawTexture(screenTexture, 1.0);
    gl.disable(gl.BLEND); 
    // swap textures
    var temp = backgroundTexture;
    backgroundTexture = screenTexture;
    screenTexture = temp;
  }

  function updateParticles() {
    drawProgram.onUpdateParticles();
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
    ctx.particleStateResolution = Math.ceil(Math.sqrt(numParticles));
    drawProgram.onParticleInit();
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