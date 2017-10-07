/**
 * This file is based on https://github.com/mapbox/webgl-wind
 * by Vladimir Agafonkin
 * 
 * Released under ISC License, Copyright (c) 2016, Mapbox
 * https://github.com/mapbox/webgl-wind/blob/master/LICENSE
 * 
 * Adapted to field maps by Andrei Kashcha
 * Copyright (C) 2017
 */
import UpdatePositionGraph from './shaderGraph/updatePositionGraph';

var quadVert = `precision mediump float;

attribute vec2 a_pos;

varying vec2 v_tex_pos;

void main() {
    v_tex_pos = a_pos;
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);
}`;

var screenFrag = `precision mediump float;

uniform sampler2D u_screen;
uniform float u_opacity;

varying vec2 v_tex_pos;

void main() {
    vec4 color = texture2D(u_screen, 1.0 - v_tex_pos);
    // a hack to guarantee opacity fade out even with a value close to 1.0
    gl_FragColor = vec4(floor(255.0 * color * u_opacity) / 255.0);
}`;

// TODO: need to add color?
var drawFrag = `precision mediump float;

varying vec2 v_particle_pos;

void main() {
   gl_FragColor = vec4(0.3, 0.74, 0.79, 1.0);
}`;

var drawVert = `precision mediump float;

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

const updateGraph = new UpdatePositionGraph();

export default {
  quadVert: quadVert,
  screenFrag: screenFrag,
  drawFrag: drawFrag,
  drawVert: drawVert,
  unsafeBuildShader,
};

function unsafeBuildShader(vectorField) {
  updateGraph.setCustomVelocity(vectorField);
  let code = updateGraph.getCode();
  let codeWithLineNumbers = addLineNumbers(code);
  return code;
}
function addLineNumbers(code) {
  return code.split('\n')
    .map((line, lineNo) => lineNo + '. ' + line).join('\n');
}