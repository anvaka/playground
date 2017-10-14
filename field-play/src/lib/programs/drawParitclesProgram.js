import util from '../gl-utils';
import DrawParticleGraph from '../shaderGraph/DrawParticleGraph';
import defaultColorProgram from './colorProgram';
import uniformColorProgram from './uniformColorProgram';
import makeUpdatePositionProgram from './updatePositionProgram';

import ColorMode from './colorModes';

export default function drawParticlesProgram(ctx) {
  var gl = ctx.gl;

  var particleStateResolution, particleIndexBuffer;
  var numParticles;

  var currentVectorField;
  var currentColorMode = ctx.colorMode;
  var updatePositionProgram = makeUpdatePositionProgram(ctx);

  var drawProgram, colorProgram;
  recompileDraw();

  return {
    onParticleInit,
    onUpdateParticles,
    drawParticles,
    updateCode,
    updateColorMode
  }

  function recompileDraw() {
    let isUniformColor = currentColorMode === ColorMode.UNIFORM;
    if (colorProgram) colorProgram.dispose();
    colorProgram = isUniformColor ? uniformColorProgram(ctx) : defaultColorProgram(ctx, currentColorMode);

    if (currentVectorField) {
      colorProgram.updateCode(currentVectorField);
      colorProgram.onParticleInit();
    }

    const drawGraph = new DrawParticleGraph(currentColorMode);
    if (drawProgram) drawProgram.unload();
    drawProgram = util.createProgram(gl, drawGraph.getVertexShader(), drawGraph.getFragmentShader());
  }

  function onUpdateParticles() {
    updatePositionProgram.onUpdateParticles();
    colorProgram.onUpdateParticles(updatePositionProgram);

    updatePositionProgram.commitUpdate();
  }

  function updateColorMode(colorMode) {
    currentColorMode = colorMode;
    recompileDraw();
  }

  function updateCode(vfCode) {
    currentVectorField = vfCode;
    updatePositionProgram.updateCode(vfCode);
    colorProgram.updateCode(vfCode);
  }

  function exp2(exponent) { return Math.exp(exponent * Math.LN2); }

  function encodeFloatRGBA(val, out, idx) {
    if (val == 0.0) {
      out[idx + 0] = 0; out[idx + 1] = 0; out[idx + 2] = 0; out[idx + 3] = 0;
    }

    var mag = Math.abs(val);
    var exponent = Math.floor(Math.log2(mag));
    // Correct log2 approximation errors.
    exponent += (exp2(exponent) <= mag / 2.0) ? 1 : 0;
    exponent -= (exp2(exponent) > mag) ? 1 : 0;

    var mantissa;
    if (exponent > 100.0) {
        mantissa = mag / 1024.0 / exp2(exponent - 10.0) - 1.0;
    } else {
        mantissa = mag / (exp2(exponent)) - 1.0;
    }

    var a = exponent + 127.0;
    mantissa *= 256.0;
    var b = Math.floor(mantissa);
    mantissa -= b;
    mantissa *= 256.0;
    var c = Math.floor(mantissa);
    mantissa -= c;
    mantissa *= 128.0;
    var d = Math.floor(mantissa) * 2.0 + ((val < 0.0) ? 1: 0);

    out[idx + 0] = a; out[idx + 1] = b; out[idx + 2] = c; out[idx + 3] = d;
  }

  function onParticleInit() {
    particleStateResolution = ctx.particleStateResolution;
    numParticles = particleStateResolution * particleStateResolution;
    var particleIndices = new Float32Array(numParticles);
    var particleStateX = new Uint8Array(numParticles * 4);
    var particleStateY = new Uint8Array(numParticles * 4);

    for (var i = 0; i < numParticles; i++) {
      // TODO: Need to constraint particles to the box.
      encodeFloatRGBA((Math.random()), particleStateX, i * 4); // [i] = 0; // randomize the initial particle positions
      encodeFloatRGBA((Math.random()), particleStateY, i * 4); // [i] = 0; // randomize the initial particle positions
      //particleStateY[i] = 0; // randomize the initial particle positions

      particleIndices[i] = i;
    }

    if (particleIndexBuffer) gl.deleteBuffer(particleIndexBuffer);
    particleIndexBuffer = util.createBuffer(gl, particleIndices);

    updatePositionProgram.onParticleInit(particleStateX, particleStateY);
    colorProgram.onParticleInit();
  }

  function drawParticles() {
    var program = drawProgram;
    gl.useProgram(program.program);
  
    util.bindAttribute(gl, particleIndexBuffer, program.a_index, 1);
    
    updatePositionProgram.bindPositionTexturesToProgram(program);
    colorProgram.onBeforeDrawParticles(program, updatePositionProgram);
  
    gl.uniform1f(program.u_particles_res, particleStateResolution);
  
    gl.drawArrays(gl.POINTS, 0, numParticles); 
  }
}