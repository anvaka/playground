export default class UpdatePositionGraph {
  constructor() {
    this.readStoredPosition = new TexturePositionDecode();
    this.getVelocity = new UserDefinedVelocityFunction();
    this.integratePositions = new RungeKuttaIntegrator();
    this.dropParticles = new RandomParticleDropper();
    this.writeComputedPosition = new TexturePositionEncode();
    this.panZoomDecode = new PanzoomTransform({decode: true});
    this.panZoomEncode = new PanzoomTransform({decode: false});
  }

  setCustomVelocity(velocityCode) {
    this.getVelocity.setNewUpdateCode(velocityCode);
  }

  getCode() {
    let code = [] 
    let nodes = [
      this.readStoredPosition,
      this.panZoomDecode,
      this.getVelocity,
      this.integratePositions,
      this.panZoomEncode,
      this.dropParticles,
      this.writeComputedPosition
    ];

    nodes.forEach(node => { addToCode(node.getDefines()); });
    nodes.forEach(node => { addToCode(node.getFunctions()); });

    addToCode('void main() {')
      nodes.forEach(node => { addToCode(node.getMainBody()); });
    addToCode('}')

    return code.join('\n');

    function addToCode(line) {
      if (line) code.push(line)
    }
  }
}

class BaseShaderNode {
  constructor() { }
  getDefines() { return ''; }
  getFunctions() { return ''; }
  getMainBody() { return ''; }
}

class TexturePositionDecode extends BaseShaderNode {
  getDefines() {
    return `
precision highp float;

uniform sampler2D u_particles;
uniform vec2 u_min;
uniform vec2 u_max;

varying vec2 v_tex_pos;
`;
  }
  getMainBody() {
    return `
  // decode particle position from pixel RGBA
  vec4 encSpeed = texture2D(u_particles, v_tex_pos);
  vec2 pos = vec2(encSpeed.r / 255.0 + encSpeed.b, encSpeed.g / 255.0 + encSpeed.a);
`;
  }
}

class PanzoomTransform extends BaseShaderNode {
  constructor(config) {
    super();
    // decode is used when we move particle read from the texture
    // otherwise we write particle to texture and need to reverse transform
    this.decode = config && config.decode;
  }

  getMainBody() {
    if (this.decode) {
      return `
  // move particle position according to current transform
  vec2 du = (u_max - u_min);
  pos.x = pos.x * du.x + u_min.x;
  pos.y = pos.y * du.y + u_min.y;
`
    }
    return `
  pos.x = (pos.x - u_min.x)/du.x;
  pos.y = (pos.y - u_min.y)/du.y;
`
  }
}

class TexturePositionEncode extends BaseShaderNode {
  getMainBody() {
    return `
  // encode the new particle position back into RGBA
  gl_FragColor = vec4(fract(pos * 255.0), floor(pos * 255.0) / 255.0);
`;
  }
}

class RungeKuttaIntegrator extends BaseShaderNode {
  constructor (stepSize = 0.01) {
    super();
    this.stepSize = stepSize;
  }

  getFunctions() {
    return `
vec2 rk4(const vec2 point) {
  float h = ${this.stepSize};
  vec2 k1 = get_velocity( point );
  vec2 k2 = get_velocity( point + k1 * h * 0.5);
  vec2 k3 = get_velocity( point + k2 * h * 0.5);
  vec2 k4 = get_velocity( point + k3 * h);

  return k1 * h / 6. + k2 * h/3. + k3 * h/3. + k4 * h/6.;
}`
  }

  getMainBody() {
    // todo: do I need to store velocity?
    return `
  vec2 velocity = rk4(pos);
  pos = pos + velocity;
`
  }
}

class UserDefinedVelocityFunction extends BaseShaderNode {
  constructor() {
    super();
    this.updateCode = '';
  }

  setNewUpdateCode(newUpdateCode) {
    this.updateCode = newUpdateCode;
  }

  getFunctions() {

  // TODO: Do I need to worry about "glsl injection" (i.e. is there potential for security attack?)
    return `
vec2 get_velocity(const vec2 p) {
  vec2 v = vec2(0.);
  ${this.updateCode}
  return v;
}
  `
  }
}

class RandomParticleDropper extends BaseShaderNode {
  getDefines() {
    return `
uniform float u_drop_rate;
uniform float u_drop_rate_bump;
uniform float u_rand_seed;
`
  }

  getFunctions() {
    // TODO: Ideally this node should probably depend on
    // random number generator node, so that we don't duplicate code
    return `
// pseudo-random generator
const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);
float rand(const vec2 co) {
  float t = dot(rand_constants.xy, co);
  return fract(sin(t) * (rand_constants.z + t));
}`
  }

  getMainBody() {
    return `
  // a random seed to use for the particle drop
  vec2 seed = (pos + v_tex_pos) * u_rand_seed;
  // drop rate is a chance a particle will restart at random position, to avoid degeneration
  float drop_rate = u_drop_rate + 0.02 * length(velocity) * u_drop_rate_bump;
  float drop = step(1.0 - drop_rate, rand(seed));

  vec2 random_pos = vec2(rand(seed + 1.3), rand(seed + 2.1));
  pos = mix(pos, random_pos, drop);
`;
  }

}