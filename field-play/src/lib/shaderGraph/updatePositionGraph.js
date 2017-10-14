import BaseShaderNode from './BaseShaderNode';
import TexturePositionNode from './TexturePositionNode';
import renderNodes from './renderNodes';
import ColorModes from '../programs/colorModes';
import UserDefinedVelocityFunction from './UserDefinedVelocityFunction';
import PanzoomTransform from './PanzoomTransform';
import RungeKuttaIntegrator from './RungeKuttaIntegrator';

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
highp float rand(vec2 co)
{
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(co.xy ,vec2(a,b));
    highp float sn= mod(dt,3.14);
    return fract(sin(sn) * c);
}
`
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