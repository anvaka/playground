const gl_utils = require('./glUtils');

module.exports = makePointsProgram;

const vertextShaderSrc = `
attribute vec2 aPosition;
attribute float aPointSize;
attribute vec4 aColor;
uniform vec2 uScreenSize;
uniform mat4 uTransform;
varying vec4 vColor;

void main() {
  gl_Position = uTransform * vec4(aPosition/uScreenSize, 0.0, 1.0);

  gl_PointSize = aPointSize * uTransform[0][0];
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

let vertexProgramCache = new Map(); // maps from GL context to program

function makePointsProgram(gl, data, screen) {
  let vertexProgram = vertexProgramCache.get(gl)
  if (!vertexProgram) {
    let vertexShader = gl_utils.compile(gl, gl.VERTEX_SHADER, vertextShaderSrc);
    let fragmentShader = gl_utils.compile(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
    vertexProgram = gl_utils.link(gl, vertexShader, fragmentShader);
    vertexProgramCache.set(gl, vertexProgram);
  }

  let locations = gl_utils.getLocations(gl, vertexProgram);
  var count = data.length / 6;

  var buffer = gl.createBuffer();
  if (!buffer) throw new Error('failed to create a nodesBuffer');

  var api = {
    draw,
    dispose
  };
  return api;

  function dispose() {
    gl.deleteBuffer(buffer);
    gl.deleteProgram(vertexProgram);
    vertexProgramCache.delete(gl);
  }

  function draw(transform) {
    gl.useProgram(vertexProgram);

    var bpe = data.BYTES_PER_ELEMENT;

    if (transform) {
      gl.uniformMatrix4fv(locations.uniforms.uTransform, false, transform.getArray());
    }
    gl.uniform2f(locations.uniforms.uScreenSize, screen.width, screen.height);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    gl.vertexAttribPointer(locations.attributes.aPosition, 2, gl.FLOAT, false, bpe * 6, 0)
    gl.enableVertexAttribArray(locations.attributes.aPosition)

    gl.vertexAttribPointer(locations.attributes.aPointSize, 1, gl.FLOAT, false, bpe * 6, 2 * bpe)
    gl.enableVertexAttribArray(locations.attributes.aPointSize)

    gl.vertexAttribPointer(locations.attributes.aColor, 3, gl.FLOAT, false, bpe * 6, 3 * bpe)
    gl.enableVertexAttribArray(locations.attributes.aColor);
    gl.drawArrays(gl.POINTS, 0, count);
  }
}