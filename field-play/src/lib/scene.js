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
    var minX = -1; var maxX = 1;
    var minY = -1; var maxY = 1;
    console.time('inittext');
    var textureSize = 1024;
    var speedMap = createSpeedMap(textureSize);
    console.timeEnd('inittext');
    windTexture = util.createTexture(gl, gl.LINEAR, speedMap, textureSize, textureSize);

    function createSpeedMap(size) {
        var result = new Uint8Array(size * size * 4);
        var uMax = Number.NEGATIVE_INFINITY;
        var vMax = Number.NEGATIVE_INFINITY;
        var uMin = Number.POSITIVE_INFINITY;
        var vMin = Number.POSITIVE_INFINITY;

        for (var row = 0; row < size; ++row) {
          for (var col = 0; col < size; ++col) {
            var x = fx(row, col);
            var y = fy(row, col);
            if (x < uMin) uMin = x;
            if (x > uMax) uMax = x;
            if (y < vMin) vMin = y;
            if (y > vMax) vMax = y;
          }
        }

        var maxValue = 0xFFFF;
        for (var row = 0; row < size; ++row) {
          var offset = row * size;
          for (var col = 0; col < size; ++col) {
            // r b, g a
            var idx = (offset + col) * 4;
            var x = fx(row, col);
            var y = fy(row, col);

            var xEnc = maxValue * (x - uMin)/(uMax - uMin);
            var r = (xEnc & 0xFF00) >> 8;
            var b = xEnc & 0xFF;

            var yEnc = maxValue * (y - vMin) /(vMax - vMin);
            if (yEnc > maxValue || xEnc > maxValue) throw new Error('out of range');

            var g = (yEnc & 0xFF00) >> 8;
            var a = yEnc & 0xFF;
            result[idx + 0] = r;
            result[idx + 1] = g;
            result[idx + 2] = b;
            result[idx + 3] = a;
          }
        }

        windData.uMax = uMax;
        windData.vMax = vMax;
        windData.uMin = uMin;
        windData.vMin = vMin;

        return result

        function fx(row, col) {
          return getXValue(minX + (maxX - minX) * (col)/size, minY + (maxY - minY) * (row) / size);
        }
        function fy(row, col) {
          return getYValue(minX + (maxX - minX) * (col)/size, minY + (maxY - minY) * (row) / size);
        }
      }

      function getXValue(x, y) {
        return -y; // y/l;
      }

      function getYValue(x, y) {
        return y * Math.cos(y);// -y/l;
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