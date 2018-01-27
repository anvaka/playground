var complexLibrary = require('./complex.glsl');

module.exports = function getFragmentCode(main) {
  var fragmentShader = `
precision highp float;
uniform float u_frame;
uniform vec3 u_transform;
uniform vec2 u_resolution;
varying vec2 v_tex_pos;

${complexLibrary}
${main}

void main() {
  float ar = u_resolution.x / u_resolution.y;
  gl_FragColor = get_color(vec2(v_tex_pos.x * ar, v_tex_pos.y));
}
`;
return fragmentShader;
}