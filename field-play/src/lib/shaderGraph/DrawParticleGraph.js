import BaseShaderNode from './BaseShaderNode';

// TODO: this duplicates code from texture position.
export default class DrawParticleGraph {
  getFragmentShader() {
  // TODO: need to add velocity based color?
    return `precision highp float;
uniform vec4 u_particle_color;
varying vec2 v_particle_pos;
varying vec4 v_particle_color;

void main() {
  // gl_FragColor = u_particle_color;
   gl_FragColor = v_particle_color;
}`
  }
  getVertexShader() {
    return `precision highp float;

attribute float a_index;

uniform sampler2D u_particles;
uniform sampler2D u_colors;
uniform float u_particles_res;
uniform vec2 u_velocity_range;

varying vec2 v_particle_pos;
varying vec4 v_particle_color;

// https://github.com/hughsk/glsl-hsv2rgb
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

highp float decodeFloatRGBA( vec4 v ) {
  float a = floor(v.r * 255.0 + 0.5);
  float b = floor(v.g * 255.0 + 0.5);
  float c = floor(v.b * 255.0 + 0.5);
  float d = floor(v.a * 255.0 + 0.5);

  float exponent = a - 127.0;
  float sign = 1.0 - mod(d, 2.0)*2.0;
  float mantissa = float(a > 0.0)
                  + b / 256.0
                  + c / 65536.0
                  + floor(d / 2.0) / 8388608.0;
  return sign * mantissa * exp2(exponent);
}

void main() {
  vec2 txPos = vec2(
        fract(a_index / u_particles_res),
        floor(a_index / u_particles_res) / u_particles_res);
  vec4 encSpeed = texture2D(u_particles, txPos);

  // decode current particle position from the pixel's RGBA value
  v_particle_pos = vec2(encSpeed.r / 255.0 + encSpeed.b, encSpeed.g / 255.0 + encSpeed.a);

  gl_PointSize = 1.0;

  // vec4 encodedVelocity = texture2D(u_colors, vec2(v_particle_pos.x, v_particle_pos.y));
  vec4 encodedVelocity = texture2D(u_colors, txPos);
  float speed = (decodeFloatRGBA(encodedVelocity) - u_velocity_range[0])/(u_velocity_range[1] - u_velocity_range[0]);
  v_particle_color = vec4(hsv2rgb(vec3(0.05 + (1. - speed) * 0.5, 0.8, 1.)), 1.0);
  // v_particle_color = vec4(mix(vec3(0.4, 0.0, 0.4), vec3(0.9, 0.9, 0.9), speed), 1.0);
  gl_Position = vec4(2.0 * v_particle_pos.x - 1.0, (1. - 2. *(v_particle_pos.y)),  0., 1.);
}`
  }
}