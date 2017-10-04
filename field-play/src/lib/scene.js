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

export default initScene;

const fadeOpacity = 0.8;

function initScene(gl, particlesCount = 10000) {
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.STENCIL_TEST); 
  var width = gl.canvas.width; 
  var height = gl.canvas.height;
  var transform = {
    scale: 1,
    dx: 0,
    dy: 0
  };
  var dt = 0.001;
  var t1 = 0;
  var t2 = 0;
  var t3 = 0;
  var t4 = 0;
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

  initParticles(particlesCount);

  var api = {
    start: nextFrame,
    stop,
    dispose,
    transform
  }

  var panzoom = makePanzoom(gl.canvas, {
    zoomSpeed: 0.025,
    controller: wglPanZoom(gl.canvas, transform, api)
  });
  panzoom.showRectangle({
    left: -window.innerWidth/2,
    top: -window.innerHeight/2,
    right: window.innerWidth/2,
    bottom: window.innerHeight/2,
  })

  return api;

  function dispose() {
      stop();
      panzoom.dispose();
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
    gl.uniform3f(program.u_camera, transform.scale, transform.dx, transform.dy);
    gl.uniform4f(program.u_timer, t1, t2, t3, t4);
    gl.uniform2f(program.u_screen_size, window.innerWidth, window.innerHeight);

    t1 = (t1 + dt) % 1;
    t2 = (t2 + dt) % 1;
    t3 = (t3 + dt) % 1;
    t4 = (t4 + dt) % 1;
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
      particleState[i] = Math.floor(Math.random() * 256); // randomize the initial particle positions
      particleIndices[i] = i;
    }
    
    // textures to hold the particle state for the current and the next frame
    particleStateTexture0 = util.createTexture(gl, gl.NEAREST, particleState, particleRes, particleRes);
    particleStateTexture1 = util.createTexture(gl, gl.NEAREST, particleState, particleRes, particleRes);

    particleIndexBuffer = util.createBuffer(gl, particleIndices);
  }

}

function wglPanZoom(canvas, transform/*, scene */) {
  return {
      applyTransform(newT) {
        var pixelRatio = 1.0; // scene.getPixelRatio(); // TODO?

        transform.dx = newT.x * pixelRatio;
        transform.dy = newT.y * pixelRatio; 
        transform.scale = newT.scale;
      },

      getOwner() {
        return canvas
      }
    }
}