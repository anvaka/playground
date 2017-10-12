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

var screenFrag = `precision highp float;
uniform sampler2D u_screen;
uniform float u_opacity;

varying vec2 v_tex_pos;

void main() {
    vec4 color = texture2D(u_screen, 1.0 - v_tex_pos);
    // a hack to guarantee opacity fade out even with a value close to 1.0
    gl_FragColor = vec4(floor(255.0 * color * u_opacity) / 255.0);
}`;

const updateGraph = new UpdatePositionGraph();
const velocityGraph = new UpdatePositionGraph({velocity: true});

export default {
  // TODO: need to find a better way for this. Maybe it's own graph?
  quadVert: updateGraph.getVertexShader(),
  screenFrag: screenFrag,
  unsafeBuildShader,
  velocityShader,
};

function velocityShader(vectorField) {
  velocityGraph.setCustomVelocity(vectorField);
  let fragment = velocityGraph.getFragmentShader();
  let vertex = velocityGraph.getVertexShader();
  return {fragment, vertex};
}

function unsafeBuildShader(vectorField) {
  updateGraph.setCustomVelocity(vectorField);
  let fragment = updateGraph.getFragmentShader();
  let vertex = updateGraph.getVertexShader();
  // let codeWithLineNumbers = addLineNumbers(code);
  return {fragment, vertex};
}

function addLineNumbers(code) {
  return code.split('\n')
    .map((line, lineNo) => lineNo + '. ' + line).join('\n');
}