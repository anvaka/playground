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

  function onParticleInit() {
    particleStateResolution = ctx.particleStateResolution;
    numParticles = particleStateResolution * particleStateResolution;
    var particleIndices = new Float32Array(numParticles);
    var particleState = new Uint8Array(numParticles * 4);

    for (var i = 0; i < particleState.length; i++) {
      particleState[i] =  Math.floor(Math.random() * 256); // randomize the initial particle positions
      particleIndices[i] = i;
    }

    if (particleIndexBuffer) gl.deleteBuffer(particleIndexBuffer);
    particleIndexBuffer = util.createBuffer(gl, particleIndices);

    updatePositionProgram.onParticleInit(particleState);
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