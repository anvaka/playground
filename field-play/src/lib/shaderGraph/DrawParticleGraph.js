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
   gl_FragColor = u_particle_color;
  // gl_FragColor = v_particle_color;
}`
  }
  getVertexShader() {
    return `precision highp float;

attribute float a_index;

uniform sampler2D u_particles;
uniform sampler2D u_colors;
uniform float u_particles_res;

varying vec2 v_particle_pos;
varying vec4 v_particle_color;

void main() {
  vec2 txPos = vec2(
        fract(a_index / u_particles_res),
        floor(a_index / u_particles_res) / u_particles_res);
  vec4 encSpeed = texture2D(u_particles, txPos);

  // decode current particle position from the pixel's RGBA value
  v_particle_pos = vec2(encSpeed.r / 255.0 + encSpeed.b, encSpeed.g / 255.0 + encSpeed.a);

  gl_PointSize = 1.0;

  // v_particle_color = texture2D(u_colors, vec2(v_particle_pos.x, v_particle_pos.y));
  gl_Position = vec4(2.0 * v_particle_pos.x - 1.0, (1. - 2. *(v_particle_pos.y)),  0., 1.);
}`
  }
}