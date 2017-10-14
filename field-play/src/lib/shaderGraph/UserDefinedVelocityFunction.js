import BaseShaderNode from './BaseShaderNode';
import snoise from './parts/simplex-noise';

export default class UserDefinedVelocityFunction extends BaseShaderNode {
  constructor(updateCode) {
    super();
    this.updateCode = updateCode || '';
  }

  setNewUpdateCode(newUpdateCode) {
    this.updateCode = newUpdateCode;
  }

  getDefines() {
    return `
uniform float u_time;
`
  }

  getFunctions() {
  // TODO: Do I need to worry about "glsl injection" (i.e. is there potential for security attack?)
  // TODO: Do I need to inject snoise only when it's used?
    return `
${snoise}
vec2 get_velocity(const vec2 p) {
  vec2 v = vec2(0.);
  ${this.updateCode}
  return v;
}
  `
  }
}
