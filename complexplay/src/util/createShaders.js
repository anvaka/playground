module.exports = createShaders;

var getFragmentCode = require('./shaders/getFragmentCode');

function createShaders(main) {
  return {
    fragmentShader: getFragmentCode(main),
    vertexShader: `
precision highp float;
attribute vec2 a_pos;

uniform float u_frame;
uniform vec2 u_resolution;
uniform vec3 u_transform;

varying vec2 v_tex_pos;

void main() {
  vec2 vv = vec2(2. * a_pos.x - 1., 1. - 2.*a_pos.y);
  v_tex_pos = vec2(
    (2.* a_pos.x - 1.0)/ u_transform.z  - u_transform.x - 1.0,
    (1. - 2.* a_pos.y)/ u_transform.z  + u_transform.y + 1.
  );

  gl_Position = vec4(vv, 0, 1);
}    
`
  }
}