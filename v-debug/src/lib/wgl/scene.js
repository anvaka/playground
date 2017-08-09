const wgl = require('./gl');

module.exports = makeScene;

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
varying vec4 vColor;

void main() {
  gl_Position = aPosition;
}
`;

const lineFSSrc = `
precision mediump float;
varying vec4 vColor;

void main() {
  gl_FragColor = vec4(0.9, 0.9, 0.9, 1.0);
}
`;

function makeScene(canvas) {
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

  var linesCount = 100;
  var itemsPerLine = 2 + 2;
  var lines = new Float32Array(linesCount * itemsPerLine);
  for (var i = 0; i < linesCount; ++i) {
    var offset = i * itemsPerLine;
    var from = Math.floor(Math.random() * count) * itemsPerElement;
    var to = Math.floor(Math.random() * count) * itemsPerElement;
    lines[offset + 0] = data[from + 0];
    lines[offset + 1] = data[from + 1];
    lines[offset + 2] = data[to + 0];
    lines[offset + 3] = data[to + 1];
  }

  var lineBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, lines, gl.STATIC_DRAW);
  gl.vertexAttribPointer(lineLoc.attributes.aPosition, 2, gl.FLOAT, false, bpe * 2, 0)
  gl.enableVertexAttribArray(lineLoc.attributes.aPosition)
  gl.drawArrays(gl.LINES, 0, linesCount * 2);
}