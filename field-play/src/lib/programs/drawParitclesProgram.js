import util from '../gl-utils';
import DrawParticleGraph from '../shaderGraph/DrawParticleGraph';
import defaultColorProgram from './colorProgram';
import uniformColorProgram from './uniformColorProgram';
import makeUpdatePositionProgram from './updatePositionProgram';
import { encodeFloatRGBA } from '../floatPacking.js';

import ColorMode from './colorModes';

export default function drawParticlesProgram(ctx) {
  var gl = ctx.gl;

  var startTime;
  var particleStateResolution, particleIndexBuffer;
  var numParticles;

  var currentVectorField = '';
  var currentColorMode = ctx.colorMode;
  var updatePositionProgram = makeUpdatePositionProgram(ctx);

  var drawProgram, colorProgram;
  updateColorProgram();

  return {
    onParticleInit,
    onUpdateParticles,
    drawParticles,
    updateCode,
    updateColorMode
  }

  function updateColorProgram() {
    let isUniformColor = currentColorMode === ColorMode.UNIFORM;
    if (colorProgram) colorProgram.dispose();
    colorProgram = isUniformColor ? uniformColorProgram(ctx) : defaultColorProgram(ctx, currentColorMode);

    if (currentVectorField) {
      colorProgram.updateCode(currentVectorField);
      colorProgram.onParticleInit();
    }

    const drawGraph = new DrawParticleGraph(currentColorMode);
    if (drawProgram) drawProgram.unload();
    drawProgram = util.createProgram(gl, drawGraph.getVertexShader(currentVectorField), drawGraph.getFragmentShader());

    startTime = new Date();
  }

  function onUpdateParticles() {
    ctx.time = (new Date() - startTime);
    let frameSeed = Math.random();
  
    updatePositionProgram.onUpdateParticles(frameSeed);
    colorProgram.onUpdateParticles(updatePositionProgram, frameSeed);

    updatePositionProgram.commitUpdate();
  }

  function updateColorMode(colorMode) {
    currentColorMode = colorMode;
    updateColorProgram();
  }

  function updateCode(vfCode) {
    currentVectorField = vfCode;
    updatePositionProgram.updateCode(vfCode);
    colorProgram.updateCode(vfCode);

    const drawGraph = new DrawParticleGraph(currentColorMode);
    if (drawProgram) drawProgram.unload();
    drawProgram = util.createProgram(gl, drawGraph.getVertexShader(currentVectorField), drawGraph.getFragmentShader());
  }


  function onParticleInit() {
    particleStateResolution = ctx.particleStateResolution;
    numParticles = particleStateResolution * particleStateResolution;
    var particleIndices = new Float32Array(numParticles);
    var particleStateX = new Uint8Array(numParticles * 4);
    var particleStateY = new Uint8Array(numParticles * 4);

    for (var i = 0; i < numParticles; i++) {
      encodeFloatRGBA((Math.random()), particleStateX, i * 4); // randomize the initial particle positions
      encodeFloatRGBA((Math.random()), particleStateY, i * 4); // randomize the initial particle positions

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
  
    gl.uniform1f(program.u_h, ctx.integrationTimeStep);
    gl.uniform1f(program.u_time, ctx.time);
    gl.uniform1f(program.u_particles_res, particleStateResolution);
    var bbox = ctx.bbox;
    gl.uniform2f(program.u_min, bbox.minX, bbox.minY);
    gl.uniform2f(program.u_max, bbox.maxX, bbox.maxY);
  
    gl.drawArrays(gl.POINTS, 0, numParticles); 
  }
}