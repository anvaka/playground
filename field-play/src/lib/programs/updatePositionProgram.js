import util from '../gl-utils';
import shaders from '../shaders';

export default function updatePositionProgram(ctx) {
  var gl = ctx.gl;
  var readTextures, writeTextures;
  var particleStateResolution;
  var updateProgram;

  return {
    updateCode,
    onUpdateParticles,
    onParticleInit,
    bindPositionTexturesToProgram,
    commitUpdate
  };

  function updateCode(vfCode) {
    let update = shaders.unsafeBuildShader(vfCode)

    // TODO: maybe use https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/shaderSource ?
    let newProgram = util.createProgram(gl, update.vertex, update.fragment);
    if (updateProgram) updateProgram.unload();
    updateProgram = newProgram;
  }
  
  function onParticleInit(x, y) {
    particleStateResolution = ctx.particleStateResolution;

    var dimensions = [{
      name: 'x',
      particleState: x
    }, {
      name: 'y',
      particleState: y
    }];
    if (readTextures) readTextures.dispose();
    readTextures = textureCollection(gl, dimensions, particleStateResolution);

    if (writeTextures) writeTextures.dispose();
    writeTextures = textureCollection(gl, dimensions, particleStateResolution);
  }

  function bindPositionTexturesToProgram(program) {
    readTextures.bindTextures(gl, program);
  }

  function commitUpdate() {
    // swap the particle state textures so the new one becomes the current one
    var temp = readTextures;
    readTextures = writeTextures;
    writeTextures = temp;
  }

  function onUpdateParticles() {
    let frameSeed = Math.random();
  
    var program = updateProgram;
    gl.useProgram(program.program);
  
    util.bindAttribute(gl, ctx.quadBuffer, program.a_pos, 2);
  
    readTextures.assignProgramUniforms(program);
  
    gl.uniform1f(program.u_rand_seed, frameSeed);
    gl.uniform1f(program.u_h, ctx.integrationTimeStep);

    var bbox = ctx.bbox;
    gl.uniform2f(program.u_min, bbox.minX, bbox.minY);
    gl.uniform2f(program.u_max, bbox.maxX, bbox.maxY);

    gl.uniform1f(program.u_drop_rate, ctx.dropProbabilty);
  
    for(var i = 0; i < writeTextures.length; ++i) {
      var writeInfo = writeTextures.get(i);
      gl.uniform1i(program.u_out_coordinate, i);
      util.bindFramebuffer(gl, ctx.framebuffer, writeInfo.texture);
      gl.viewport(0, 0, particleStateResolution, particleStateResolution);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }
}

function textureCollection(gl, dimensions, particleStateResolution) {
  var index = 1;
  var textures = dimensions.map(d => {
    var textureInfo = {
      texture: util.createTexture(gl, gl.NEAREST, d.particleState, particleStateResolution, particleStateResolution),
      index: index,
      name: d.name
    }
    // TODO: need to see if I can simplify this. Second slot is taken by color.
    if (index === 1) index = 2;
    index += 1;

    return textureInfo;
  })

  return {
    dispose,
    bindTextures,
    assignProgramUniforms,
    length: dimensions.length,
    textures,
    get(i) { return textures[i]; }
  }

  function assignProgramUniforms(program) {
    textures.forEach(tInfo => {
      gl.uniform1i(program['u_particles_' + tInfo.name], tInfo.index);
    });
  }

  function dispose() {
    textures.forEach(tInfo => gl.deleteTexture(tInfo.texture));
  }

  function bindTextures(gl, program) {
    textures.forEach((tInfo) => {
      util.bindTexture(gl, tInfo.texture, tInfo.index);
      gl.uniform1i(program['u_particles_' + tInfo.name], tInfo.index);
    })
  }
}