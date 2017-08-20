const gl_utils = require('../glUtils');

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
uniform vec4 uColor;

void main() {
  gl_FragColor = uColor;
}
`;

// TODO: this needs to be in a separate file, with proper resource management
let lineProgramCache = new Map(); // maps from GL context to program

function makeLineProgram(gl, data, drawTriangles) {
  let lineProgram = lineProgramCache.get(gl)
  if (!lineProgram) {
    var lineVSShader = gl_utils.compile(gl, gl.VERTEX_SHADER, lineVSSrc);
    var lineFSShader = gl_utils.compile(gl, gl.FRAGMENT_SHADER, lineFSSrc);
    lineProgram = gl_utils.link(gl, lineVSShader, lineFSShader);
    lineProgramCache.set(gl, lineProgram);
  }

  var locations = gl_utils.getLocations(gl, lineProgram);

  var lineBuffer = gl.createBuffer();
  var bpe = data.BYTES_PER_ELEMENT;
  var drawType = drawTriangles ? gl.TRIANGLES : gl.LINES;
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer)

  var api = {
    draw,
    dispose
  }

  return api;

  function dispose() {
    gl.deleteBuffer(lineBuffer);
    gl.deleteProgram(lineProgram);
    lineProgramCache.delete(gl);
  }

  function draw(transform, color, screen) {
    gl.useProgram(lineProgram);

    gl.uniformMatrix4fv(locations.uniforms.uTransform, false, transform.getArray());
    gl.uniform2f(locations.uniforms.uScreenSize, screen.width, screen.height);
    gl.uniform4f(locations.uniforms.uColor, color.r, color.g, color.b, color.a);

    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(locations.attributes.aPosition, 2, gl.FLOAT, false, bpe * 2, 0)
    gl.enableVertexAttribArray(locations.attributes.aPosition)

    gl.drawArrays(drawType, 0, data.length / 2);
  }
}
