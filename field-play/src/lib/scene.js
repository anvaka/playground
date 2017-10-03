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

export default initScene;

const fadeOpacity = 0.998;

function initScene(gl, particlesCount = 10000) {
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.STENCIL_TEST); 
  var width = gl.canvas.width; 
  var height = gl.canvas.height;

  var framebuffer = gl.createFramebuffer();
  var quadBuffer = util.createBuffer(gl, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]));
  
  var emptyPixels = new Uint8Array(width * height * 4);

  var screenTexture = util.createTexture(gl, gl.NEAREST, emptyPixels, width, height);
  var backgroundTexture = util.createTexture(gl, gl.NEAREST, emptyPixels, width, height);

  var screenProgram = util.createProgram(gl, shaders.quadVert, shaders.screenFrag);
  var drawProgram = util.createProgram(gl, shaders.drawVert, shaders.drawFrag);
  var updateProgram = util.createProgram(gl, shaders.quadVert, shaders.updateFrag);

  // particles
  var particleStateResolution, _numParticles, particleStateTexture0, particleStateTexture1, particleIndices, particleIndexBuffer;
  var lastAnimationFrame;

  var windTexture;
  var windData = {
    uMin: -1.0,
    uMax: 1.0,
    vMin: -1.0,
    vMax: 1.0,
    width: 512,
    height: 512,
  }
  initWind();
  
  initParticles(particlesCount);
  
  return {
    start: nextFrame,
    stop
  }

  function initWind() {
    console.time('inittext');
    var speedMap = createSpeedMap(windData.width);
    console.timeEnd('inittext');
    windTexture = util.createTexture(gl, gl.LINEAR, speedMap, windData.width, windData.height);

    function createSpeedMap(size) {
        var result = new Uint8Array(size * size * 4);
        windData.uMax = size;
        windData.vMax = size;
        windData.uMin = -size;
        windData.vMin = -size;
        for (var row = 0; row < size; ++row) {
          // min .. max; 
          // v = 0 .. 255
          // 1 * 255/(max - min)
          // 

          // 255/40
          var offset = row * size;
          for (var col = 0; col < size; ++col) {
            var x = encodeY(-row + size/2);
            var y = encodeX(col - size/2);
            var idx = (offset + col) * 4;
            result[idx + 0] = Math.floor(x);
            result[idx + 1] = Math.floor(y);
            result[idx + 2] = 0;
            result[idx + 3] = 255;
          }
        }
        return result

        function encodeY(y) {
          return 255 * (y - windData.vMin)/(windData.vMax - windData.vMin);
        }

        function encodeX(x) {
          return 255 * (x - windData.uMin)/(windData.uMax - windData.uMin);
        }
      }
  }

  function nextFrame() {
    lastAnimationFrame = requestAnimationFrame(draw);
  }

  function stop() {
    cancelAnimationFrame(lastAnimationFrame);
    lastAnimationFrame = 0;
  }

  function draw() {
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);
    
    util.bindTexture(gl, particleStateTexture0, 1);
    util.bindTexture(gl, windTexture, 0);
    
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
  
    gl.uniform1i(program.u_wind, 0);
    gl.uniform1i(program.u_particles, 1);
  
    gl.uniform1f(program.u_rand_seed, Math.random());
    gl.uniform2f(program.u_wind_res, windData.width, windData.height);
    gl.uniform2f(program.u_wind_min, windData.uMin, windData.vMin);
    gl.uniform2f(program.u_wind_max, windData.uMax, windData.vMax);

    gl.uniform1f(program.u_speed_factor, 0.25);
    gl.uniform1f(program.u_drop_rate, 0.003);
    gl.uniform1f(program.u_drop_rate_bump, 0.01);
  
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
  
    gl.uniform1i(program.u_wind, 0);
    gl.uniform1i(program.u_particles, 1);
  //   gl.uniform1i(program.u_color_ramp, 2);
  
    gl.uniform1f(program.u_particles_res, particleStateResolution);
    gl.uniform2f(program.u_wind_min, windData.uMin, windData.vMin);
    gl.uniform2f(program.u_wind_max, windData.uMax, windData.vMax);
  
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
      particleState[i] = Math.floor(Math.random() * 256); // randomize the initial particle positions
      particleIndices[i] = i;
    }
    
    // textures to hold the particle state for the current and the next frame
    particleStateTexture0 = util.createTexture(gl, gl.NEAREST, particleState, particleRes, particleRes);
    particleStateTexture1 = util.createTexture(gl, gl.NEAREST, particleState, particleRes, particleRes);

    particleIndexBuffer = util.createBuffer(gl, particleIndices);
  }

}