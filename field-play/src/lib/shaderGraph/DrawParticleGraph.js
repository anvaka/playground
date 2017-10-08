import BaseShaderNode from './BaseShaderNode';

// TODO: this duplicates code from texture position.
export default class DrawParticleGraph {
  getFragmentShader() {
  // TODO: need to add velocity based color?
    return `precision highp float;
uniform vec4 u_particle_color;
varying vec2 v_particle_pos;

void main() {
   gl_FragColor = u_particle_color;
}`
  }
  getVertexShader() {
    return `precision highp float;

attribute float a_index;

uniform sampler2D u_particles;
uniform float u_particles_res;

varying vec2 v_particle_pos;

void main() {
    vec4 encSpeed = texture2D(u_particles, vec2(
        fract(a_index / u_particles_res),
        floor(a_index / u_particles_res) / u_particles_res));

    // decode current particle position from the pixel's RGBA value
    v_particle_pos = vec2(encSpeed.r / 255.0 + encSpeed.b, encSpeed.g / 255.0 + encSpeed.a);

    gl_PointSize = 1.0;
    gl_Position = vec4(2.0 * v_particle_pos.x - 1.0, (1. - 2. *(v_particle_pos.y)),  0., 1.);
}`
  }
}

class PositionSizeNode extends BaseShaderNode {

}