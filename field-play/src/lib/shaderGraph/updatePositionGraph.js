import BaseShaderNode from './BaseShaderNode';
import TexturePositionNode from './TexturePositionNode';
import renderNodes from './renderNodes';
import ColorModes from '../programs/colorModes';

export default class UpdatePositionGraph {
  constructor(options) {
    this.readStoredPosition = new TexturePositionNode(/* isDecode = */ true);
    this.getVelocity = new UserDefinedVelocityFunction();
    this.integratePositions = new RungeKuttaIntegrator();
    this.dropParticles = new RandomParticleDropper();
    this.writeComputedPosition = new TexturePositionNode(/* isDecode = */ false);
    this.panZoomDecode = new PanzoomTransform({decode: true});
    this.panZoomEncode = new PanzoomTransform({decode: false});

    this.colorOnly = options && options.velocity;
    this.colorMode = options && options.colorMode;
  }

  setCustomVelocity(velocityCode) {
    this.getVelocity.setNewUpdateCode(velocityCode);
  }

  getVertexShader () {
    return `precision highp float;

attribute vec2 a_pos;
varying vec2 v_tex_pos;

void main() {
    v_tex_pos = a_pos;
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);
}`
  }

  getFragmentShader() {
    let nodes;
    if (this.colorOnly) {
      nodes = this.getColorShaderNodes(this.colorMode);
    } else {
      nodes = this.getUpdatePositionShaderNodes();
    }

    return renderNodes(nodes);
  }

  getUpdatePositionShaderNodes() {
    return [
      this.readStoredPosition,
      this.dropParticles,
      this.panZoomDecode,
      this.getVelocity,
      this.integratePositions, {
        getMainBody() {
          return `
  pos = pos + velocity;
  `
        }
      },
      this.panZoomEncode,
      this.writeComputedPosition
    ]
  }


  getColorShaderNodes(colorMode) {
    return [
      this.readStoredPosition,
      this.dropParticles,
      this.panZoomDecode,
      this.getVelocity,
      this.integratePositions,
      {
        getMainBody() {
          if (colorMode === ColorModes.ANGLE) {

            return `
   gl_FragColor = encodeFloatRGBA(atan(velocity.y, velocity.x)); 
`
          }
          return `
  gl_FragColor = encodeFloatRGBA(length(velocity));
`
        }
      }
    ];
  }
}

class PanzoomTransform extends BaseShaderNode {
  constructor(config) {
    super();
    // decode is used when we move particle read from the texture
    // otherwise we write particle to texture and need to reverse transform
    this.decode = config && config.decode;
  }

  getDefines() {
    if (this.decode) {
      // TODO: Need to figure out how to not duplicate this.
    return `
  uniform vec2 u_min;
  uniform vec2 u_max;
`;
    }
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

class RungeKuttaIntegrator extends BaseShaderNode {
  constructor () {
    super();
  }

  getDefines() {
    return `
  uniform float u_h;
`
  }

  getFunctions() {
    return `
vec2 rk4(const vec2 point) {
  vec2 k1 = get_velocity( point );
  vec2 k2 = get_velocity( point + k1 * u_h * 0.5);
  vec2 k3 = get_velocity( point + k2 * u_h * 0.5);
  vec2 k4 = get_velocity( point + k3 * u_h);

  return k1 * u_h / 6. + k2 * u_h/3. + k3 * u_h/3. + k4 * u_h/6.;
}`
  }

  getMainBody() {
    // todo: do I need to store velocity?
    return `
  vec2 velocity = rk4(pos);
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
  float drop = step(1.0 - u_drop_rate, rand(seed));

  vec2 random_pos = vec2(rand(seed + 0.19), rand(seed + 0.84));
  pos = mix(pos, random_pos, drop);
`;
  }

}