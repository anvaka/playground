import BaseShaderNode from './BaseShaderNode';

/**
 * Reads/writes particle coordinates from/to a texture;
 */
export default class TexturePosition extends BaseShaderNode {
  constructor(isDecode) {
    super();

    // When it's decoding, it must read from the texture.
    // Otherwise it must write to the texture;
    this.isDecode = isDecode;
  }

  getDefines() {
    if (this.isDecode) {
      // TODO: How to avoid duplication and silly checks?
    return `
precision highp float;

uniform sampler2D u_particles;

varying vec2 v_tex_pos;
`;
    }
  }
  getMainBody() {
    if (this.isDecode) {
      return `
  // decode particle position from pixel RGBA
  vec4 encSpeed = texture2D(u_particles, v_tex_pos);
  vec2 pos = vec2(encSpeed.r / 255.0 + encSpeed.b, encSpeed.g / 255.0 + encSpeed.a);
`;
    }
    return `
  // encode the new particle position back into RGBA
  gl_FragColor = vec4(fract(pos * 255.0), floor(pos * 255.0) / 255.0);
    `
  }
}