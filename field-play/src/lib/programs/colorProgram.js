import UpdatePositionGraph from '../shaderGraph/updatePositionGraph';
import util from '../gl-utils';
import bus from '../bus';

/**
 * This program allows to change color of each particle. It works by
 * reading current velocities into a texture from the framebuffer. Once
 * velocities are read, it checks velocity scale and passes it to a draw program.
 */
export default function colorProgram(ctx, colorMode) {
  var maxV, minV, speedNeedsUpdate = true;
  var {gl} = ctx;
  var velocityProgram;
  var velocityTexture;
  var particleStateResolution;
  var pendingSpeedUpdate;
  var numParticles;
  let colorTextureGraph = new UpdatePositionGraph({velocity: true, colorMode});

  listenToEvents();

  return {
    updateCode,
    onUpdateParticles,
    onParticleInit,
    onBeforeDrawParticles,
    requestSpeedUpdate,
    dispose
  };

  function listenToEvents() {
    bus.on('integration-timestep-changed', requestSpeedUpdate);
    bus.on('bbox-change', requestSpeedUpdate);
  }

  function dispose() {
    bus.off('integration-timestep-changed', requestSpeedUpdate);
    bus.on('bbox-change', requestSpeedUpdate);
    if (velocityTexture) gl.deleteTexture(velocityTexture);
    if (velocityProgram) velocityProgram.unload(); 
  }

  function requestSpeedUpdate() {
    if (pendingSpeedUpdate) clearTimeout(pendingSpeedUpdate);
    pendingSpeedUpdate = setTimeout(() => {
      speedNeedsUpdate = true;
      pendingSpeedUpdate = 0;
    }, 50);
  }

  function onBeforeDrawParticles(program) {
    util.bindTexture(gl, velocityTexture, 2);
    gl.uniform2f(program.u_velocity_range, minV, maxV);
    gl.uniform1i(program.u_colors, 2);
  }

  function onParticleInit() {
    if (velocityTexture) gl.deleteTexture(velocityTexture);
    particleStateResolution = ctx.particleStateResolution;
    numParticles = particleStateResolution * particleStateResolution;

    var velocityState = new Uint8Array(numParticles * 4);
    velocityTexture = util.createTexture(gl, gl.NEAREST, velocityState, particleStateResolution, particleStateResolution);

    requestSpeedUpdate();
  }

  function updateCode(vfCode) {
    colorTextureGraph.setCustomVelocity(vfCode);
    let fragment = colorTextureGraph.getFragmentShader();
    let vertex = colorTextureGraph.getVertexShader();
    let newVelocityProgram = util.createProgram(gl, vertex, fragment);
    if (velocityProgram) velocityProgram.unload();
    velocityProgram = newVelocityProgram;
    requestSpeedUpdate();
  }

  function onUpdateParticles(updatePositionProgram) {
    util.bindFramebuffer(gl, ctx.framebuffer, velocityTexture);
    gl.viewport(0, 0, particleStateResolution, particleStateResolution);
  
    var program = velocityProgram;
    gl.useProgram(program.program);
  
    updatePositionProgram.bindPositionTexturesToProgram(program);
    util.bindAttribute(gl, ctx.quadBuffer, program.a_pos, 2);

    gl.uniform1f(program.u_h, ctx.integrationTimeStep);
    var bbox = ctx.bbox;
    gl.uniform2f(program.u_min, bbox.minX, bbox.minY);
    gl.uniform2f(program.u_max, bbox.maxX, bbox.maxY);
  
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (!speedNeedsUpdate) return;

    speedNeedsUpdate = false;
    var velocityState = new Uint8Array(numParticles * 4);
    gl.readPixels(0, 0, particleStateResolution, particleStateResolution, gl.RGBA, gl.UNSIGNED_BYTE, velocityState);

    maxV = Number.NEGATIVE_INFINITY;
    minV = Number.POSITIVE_INFINITY;
    // TODO: Do I want this to be async?
    for(var i = 0; i < velocityState.length; i+=4) {
      let r = velocityState[i + 0];
      let g = velocityState[i + 1];
      let b = velocityState[i + 2];
      let a = velocityState[i + 3];
      let v = decodeRGBA(r, g, b, a);
      if (v > maxV) maxV = v;
      if (v < minV) minV = v;
    }
  }
}

// TODO: Move this to separate file.
function decodeRGBA(r, g, b, a) {
  var A = Math.floor(r + 0.5);
  var B = Math.floor(g + 0.5);
  var C = Math.floor(b + 0.5);
  var D = Math.floor(a + 0.5);

  var exponent = A - 127.0;
  var sign = 1.0 - (D % 2.0) * 2.0;
  var mantissa = ((A > 0.0) ? 1 : 0)
                  + B / 256.0
                  + C / 65536.0
                  + Math.floor(D / 2.0) / 8388608.0;
  return sign * mantissa * Math.exp(exponent * Math.LN2);
}