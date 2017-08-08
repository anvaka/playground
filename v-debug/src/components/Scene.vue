<template>
  <canvas></canvas>
</template>

<script>
const vertextShaderSrc = `
attribute vec4 aPosition;
attribute float aPointSize;
attribute vec4 aColor;
varying vec4 vColor;

void main() {
  gl_Position = aPosition;
  gl_PointSize = aPointSize;
  vColor = aColor;
}
`;

const fragmentShaderSrc = `
precision mediump float;
varying vec4 vColor;

void main() {
  gl_FragColor = vColor;
}
`;

const lineVSSrc = `
attribute vec4 aPosition;
attribute vec4 aColor;
varying vec4 vColor;

void main() {
  gl_Position = aPosition;
  vColor = aColor;
}
`;

const lineFSSrc = `
precision mediump float;
varying vec4 vColor;

void main() {
  gl_FragColor = vColor;
}
`;

const wgl = require('./gl');

export default {
  name: 'Scene',
  mounted() {
    let canvas = this.$el;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    gl.clearColor(0, 0, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.viewport(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    let vertexShader = wgl.compile(gl, gl.VERTEX_SHADER, vertextShaderSrc);
    let fragmentShader = wgl.compile(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
    let vertexProgram = wgl.link(gl, vertexShader, fragmentShader);
    gl.useProgram(vertexProgram);

    let locations = wgl.getLocations(gl, vertexProgram);

var count = 100;
var itemsPerElement = 6;
var data = new Float32Array(count * itemsPerElement);
for (var i = 0; i < count; ++i) {
  var offset = i * itemsPerElement;
  data[offset + 0] = 2 * (Math.random() - 0.5);
  data[offset + 1] = 2 * (Math.random() - 0.5);
  data[offset + 2] = 1 + (Math.random() * 10);
  data[offset + 3] = 0.5 + Math.random() * 0.5;
  data[offset + 4] = 0.5 + Math.random() * 0.5;
  data[offset + 5] = 0.5 + Math.random() * 0.5;
}

var buffer = gl.createBuffer();
var bpe = data.BYTES_PER_ELEMENT;

if (!buffer) throw new Error('failed to create a buffer');

gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

gl.vertexAttribPointer(locations.attributes.aPosition, 2, gl.FLOAT, false, bpe * 6, 0)
gl.enableVertexAttribArray(locations.attributes.aPosition)

gl.vertexAttribPointer(locations.attributes.aPointSize, 1, gl.FLOAT, false, bpe * 6, 2 * bpe)
gl.enableVertexAttribArray(locations.attributes.aPointSize)

gl.vertexAttribPointer(locations.attributes.aColor, 3, gl.FLOAT, false, bpe * 6, 3 * bpe)
gl.enableVertexAttribArray(locations.attributes.aColor);
gl.drawArrays(gl.POINTS, 0, count);


let lineVSShader = wgl.compile(gl, gl.VERTEX_SHADER, lineVSSrc);
let lineFSShader = wgl.compile(gl, gl.FRAGMENT_SHADER, lineFSSrc);
let lineProgram = wgl.link(gl, lineVSShader, lineFSShader);
gl.useProgram(lineProgram);

let lineLoc = wgl.getLocations(gl, lineProgram);

var linesCount = 10;
var linesColor = new Float32Array(linesCount * 4);
for(var i = 0; i < linesCount; ++i) {
  var offset = i * 4;
  linesColor[offset + 0] = 1;
  linesColor[offset + 1] = 1;
  linesColor[offset + 2] = 1;
  linesColor[offset + 3] = 1;
}
wgl.initBuffer(gl, linesColor, 4, lineLoc.attributes.aColor);

var linkIndexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, linkIndexBuffer);
var lines = new Uint16Array(linesCount * 2);
for (var i = 0; i < 1; ++i) {
  var offset = i * 2;
  lines[offset + 0] = 0;
  lines[offset + 1] = 10; // Math.floor(Math.random() * count);
}
// gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, lines, gl.STATIC_DRAW);
// gl.drawElements(gl.LINES, 2, gl.UNSIGNED_SHORT, 0);

// using independent buffers
    // var positions = new Float32Array([0, 0.5, -0.5, -0.5, 0.5, -0.5]);
    // var pointSize = new Float32Array([10, 20, 30]);
    // var colors = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);

    // wgl.initBuffer(gl, positions, 2, locations.attributes.aPosition);
    // wgl.initBuffer(gl, pointSize, 1, locations.attributes.aPointSize);
    // wgl.initBuffer(gl, colors, 3, locations.attributes.aColor);
    // gl.drawArrays(gl.POINTS, 0, 3);

/// Using one call per point
    // var p = [
    //   {x: 0, y: 0.5, sz: 10, r: 1, g: 0, b: 0},
    //   {x: -0.5, y: -0.5, sz: 20, r: 0, g: 1, b: 0},
    //   {x: 0.5, y: -0.5, sz: 30, r: 0, g: 0, b: 1}
    // ]

    // for (var i = 0; i < p.length; ++i) {
    //   gl.vertexAttrib4f(locations.attributes.aPosition, p[i].x, p[i].y, 0, 1);
    //   gl.vertexAttrib1f(locations.attributes.aPointSize, p[i].sz);
    //   gl.vertexAttrib4f(locations.attributes.aColor, p[i].r, p[i].g, p[i].b, 1.0);
    //   gl.drawArrays(gl.POINTS, 0, 1);
    // }
  }
}
</script>

<style>
  canvas {
    width: 100%;
    height: 100%;
  }
</style>


