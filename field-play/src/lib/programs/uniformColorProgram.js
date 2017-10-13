
export default function uniformColor(ctx) {
  let {gl} = ctx;
  let particleColor = { r: 77, g: 188, b: 201, a: 1  };

  return {
    updateCode: noop,
    onUpdateParticles: noop,
    onParticleInit: noop,
    onBeforeDrawParticles,
    requestSpeedUpdate: noop,
    dispose: noop
  };

  function onBeforeDrawParticles(program) {
    gl.uniform4f(program.u_particle_color, particleColor.r/255, particleColor.g/255, particleColor.b/255, particleColor.a);
  }
}

function noop() {}