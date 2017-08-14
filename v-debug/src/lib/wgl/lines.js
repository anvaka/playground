const gl_utils = require('./glUtils');

module.exports = makeLineProgram;

const lineVSSrc = `
attribute vec2 aPosition;
uniform vec2 uScreenSize;
uniform mat4 uTransform;
varying vec4 vColor;

void main() {
  gl_Position = uTransform * vec4(aPosition/uScreenSize, 0.0, 1.0);
}
`;

const lineFSSrc = `
precision mediump float;
varying vec4 vColor;

void main() {
  gl_FragColor = vec4(0.8, 0.2, 0.9, 1.);
}
`;

function makeLineProgram(gl, data, options) {
  let lineVSShader = gl_utils.compile(gl, gl.VERTEX_SHADER, lineVSSrc);
  let lineFSShader = gl_utils.compile(gl, gl.FRAGMENT_SHADER, lineFSSrc);
  let lineProgram = gl_utils.link(gl, lineVSShader, lineFSShader);

  let locations = gl_utils.getLocations(gl, lineProgram);
  var linesCount = data.length / 4;
  var lineBuffer = gl.createBuffer();
  var bpe = data.BYTES_PER_ELEMENT;
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer)

  var api = {
    draw,
  }

  return api;
  
  function draw() {
    gl.useProgram(lineProgram);

    gl.uniformMatrix4fv(locations.uniforms.uTransform, false, options.transform);
    gl.uniform2f(locations.uniforms.uScreenSize, options.width, options.height);

    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(locations.attributes.aPosition, 2, gl.FLOAT, false, bpe * 2, 0)
    gl.enableVertexAttribArray(locations.attributes.aPosition)
    gl.drawArrays(gl.LINES, 0, linesCount * 2);
  }
}
