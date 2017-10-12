import util from '../gl-utils';
import DrawParticleGraph from '../shaderGraph/DrawParticleGraph';
import defaultColorProgram from './colorProgram';
import makeUpdatePositionProgram from './updatePositionProgram';

// TODO: Refactor
const drawGraph = new DrawParticleGraph();

export default function drawParticlesProgram(ctx) {
  var gl = ctx.gl;
  var drawProgram = util.createProgram(gl, drawGraph.getVertexShader(), drawGraph.getFragmentShader());

  var particleStateResolution, particleIndexBuffer;
  var numParticles;

  var updatePositionProgram = makeUpdatePositionProgram(ctx);
  var colorProgram = defaultColorProgram(ctx);

  return {
    onParticleInit,
    onUpdateParticles,
    drawParticles,
    updateCode
  }

  function onUpdateParticles() {
    updatePositionProgram.onUpdateParticles();
    colorProgram.onUpdateParticles();

    updatePositionProgram.commitUpdate();
  }

  function updateCode(vfCode) {
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
    
    // TODO: This should be coming from static color program.
    // gl.uniform4f(program.u_particle_color, particleColor.r/255, particleColor.g/255, particleColor.b/255, particleColor.a);
    gl.uniform1i(program.u_particles, 1);

    updatePositionProgram.onBeforeDrawParticles(program);
    colorProgram.onBeforeDrawParticles(program);
  
    gl.uniform1f(program.u_particles_res, particleStateResolution);
  
    gl.drawArrays(gl.POINTS, 0, numParticles); 
  }
}