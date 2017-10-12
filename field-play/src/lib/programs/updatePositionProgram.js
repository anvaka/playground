import util from '../gl-utils';
import shaders from '../shaders';

export default function updatePositionProgram(ctx) {
  var gl = ctx.gl;
  var particleStateTexture0, particleStateTexture1;
  var particleStateResolution;
  var updateProgram;

  return {
    updateCode,
    onUpdateParticles,
    onParticleInit,
    onBeforeDrawParticles,
    commitUpdate
  };

  function updateCode(vfCode) {
    let update = shaders.unsafeBuildShader(vfCode)

    // TODO: maybe use https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/shaderSource ?
    let newProgram = util.createProgram(gl, update.vertex, update.fragment);
    if (updateProgram) updateProgram.unload();
    updateProgram = newProgram;
  }
  
  function onParticleInit(particleState) {
    particleStateResolution = ctx.particleStateResolution;

    // TODO: More precise texture
    // textures to hold the particle state for the current and the next frame
    if (particleStateTexture0) gl.deleteTexture(particleStateTexture0);
    particleStateTexture0 = util.createTexture(gl, gl.NEAREST, particleState, particleStateResolution, particleStateResolution);
    if (particleStateTexture1) gl.deleteTexture(particleStateTexture1);
    particleStateTexture1 = util.createTexture(gl, gl.NEAREST, particleState, particleStateResolution, particleStateResolution);
  }

  function onBeforeDrawParticles(/* program */) {
    util.bindTexture(gl, particleStateTexture0, 1);
  }

  function commitUpdate() {
    // swap the particle state textures so the new one becomes the current one
    var temp = particleStateTexture0;
    particleStateTexture0 = particleStateTexture1;
    particleStateTexture1 = temp;
  }

  function onUpdateParticles() {
    util.bindFramebuffer(gl, ctx.framebuffer, particleStateTexture1);
    gl.viewport(0, 0, particleStateResolution, particleStateResolution);
  
    var program = updateProgram;
    gl.useProgram(program.program);
  
    util.bindAttribute(gl, ctx.quadBuffer, program.a_pos, 2);
  
    gl.uniform1i(program.u_particles, 1);
  
    gl.uniform1f(program.u_rand_seed, Math.random());
    gl.uniform1f(program.u_h, ctx.integrationTimeStep);

    var bbox = ctx.bbox;
    gl.uniform2f(program.u_min, bbox.minX, bbox.minY);
    gl.uniform2f(program.u_max, bbox.maxX, bbox.maxY);

    gl.uniform1f(program.u_drop_rate, ctx.dropProbabilty);
  
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}