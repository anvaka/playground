import decodeFloatRGBA from './parts/decodeFloatRGBA';
import ColorModes from '../programs/colorModes'

// TODO: this duplicates code from texture position.
export default class DrawParticleGraph {
  constructor(colorMode) {
    this.colorMode = colorMode;
    this.isUniformColor = colorMode === ColorModes.UNIFORM;
  }

  getFragmentShader() {
    let variables = [];
    var mainBody = [];

    if (this.isUniformColor) {
      variables.push('uniform vec4 u_particle_color;');
      mainBody.push('gl_FragColor = u_particle_color;');
    } else {
      variables.push('varying vec4 v_particle_color;');
      mainBody.push('gl_FragColor = v_particle_color;');
    }
    return `precision highp float;
${variables.join('\n')}

void main() {
${mainBody.join('\n')}
}`
  }

  getVertexShader() {
    let decodePositions = textureBasedPosition();
    let colorParts = this.isUniformColor ? uniformColor() : textureBasedColor(this.colorMode);
    let variables = [
      decodePositions.getVariables(),
      colorParts.getVariables()
    ]
    let methods = []
    addMethods(decodePositions, methods);
    addMethods(colorParts, methods);
    let main = [];
    addMain(decodePositions, main);
    addMain(colorParts, main);

    return `precision highp float;
attribute float a_index;
uniform float u_particles_res;

${variables.join('\n')}
${decodeFloatRGBA}
${methods.join('\n')}

void main() {
  vec2 txPos = vec2(
        fract(a_index / u_particles_res),
        floor(a_index / u_particles_res) / u_particles_res);
  gl_PointSize = 1.0;

${main.join('\n')}

  gl_Position = vec4(2.0 * particle_pos.x - 1.0, (1. - 2. * (particle_pos.y)),  0., 1.);
}`
  }
}

function addMethods(producer, array) {
  if (producer.getMethods) {
    array.push(producer.getMethods());
  }
}
function addMain(producer, array) {
  if (producer.getMain) {
    array.push(producer.getMain());
  }
}

function textureBasedColor(colorMode) {
  return {
    getVariables,
    getMain,
    getMethods
  }

  function getVariables() {
    let defines = '';
    if (colorMode === ColorModes.ANGLE) {
      defines = `#define M_PI 3.1415926535897932384626433832795`;
    }
    return `
uniform sampler2D u_colors;
uniform vec2 u_velocity_range;
${defines}
varying vec4 v_particle_color;

`
  }

  function getMethods() {
    return `
// https://github.com/hughsk/glsl-hsv2rgb
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

`
  }

  function getMain() {
    let decode = colorMode === ColorModes.VELOCITY ?
      `
  float speed = (decodeFloatRGBA(encodedColor) - u_velocity_range[0])/(u_velocity_range[1] - u_velocity_range[0]);
  v_particle_color = vec4(hsv2rgb(vec3(0.05 + (1. - speed) * 0.5, 0.9, 1.)), 1.0);
` : `
  float speed = (decodeFloatRGBA(encodedColor) + M_PI)/(2.0 * M_PI);
  v_particle_color = vec4(hsv2rgb(vec3(0.05 + (1. - speed) * 0.5, 0.9, 1.)), 1.0);
  v_particle_color = vec4(hsv2rgb(vec3(speed, 0.9, 1.)), 1.0);
`;

    return `
vec4 encodedColor = texture2D(u_colors, txPos);
${decode}
`
  }

}

function uniformColor() {
  return {
    getVariables,
    getMain
  }

  function getVariables() {

  }
  function getMain() {

  }
}

function textureBasedPosition() {
  return {
    getVariables,
    getMain
  }

  function getVariables() {
    return `
uniform sampler2D u_particles_x;
uniform sampler2D u_particles_y;
    `
  }

  function getMain() {
    return `
  //vec4 encPos = texture2D(u_particles, txPos);

  // decode current particle position from the pixel's RGBA value
//   vec2 particle_pos = vec2(encPos.r / 255.0 + encPos.b, encPos.g / 255.0 + encPos.a);

  vec2 particle_pos = vec2(
    decodeFloatRGBA(texture2D(u_particles_x, txPos)),
    decodeFloatRGBA(texture2D(u_particles_y, txPos))
  );
`
  }
}