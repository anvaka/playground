const wgl = require('./gl');

module.exports = makeScene;

const vertextShaderSrc = `
attribute vec2 aPosition;
attribute float aPointSize;
attribute vec4 aColor;
uniform vec2 uScreenSize;
uniform mat4 uTransform;
varying vec4 vColor;

void main() {
  gl_Position = uTransform * vec4(aPosition/uScreenSize, 0.0, 1.0);

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
  

  var count = 100;
  var itemsPerElement = 6;
  var nodesData = new Float32Array(count * itemsPerElement);
  for (var i = 0; i < count; ++i) {
    var offset = i * itemsPerElement;
    nodesData[offset + 0] = (Math.random() * 750);
    nodesData[offset + 1] = (Math.random() * 750);
    nodesData[offset + 2] = 1 + (Math.random() * 10);
    nodesData[offset + 3] = 0.5 + Math.random() * 0.5;
    nodesData[offset + 4] = 0.5 + Math.random() * 0.5;
    nodesData[offset + 5] = 0.5 + Math.random() * 0.5;
  }
  var transform = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ];

  var screen = {
    width: canvas.width,
    height: canvas.height,
    transform: transform
  };
  var nodeProgram = makeNodeProgram(gl, nodesData, screen)



  var linesCount = 100;
  var itemsPerLine = 2 + 2;
  var lines = new Float32Array(linesCount * itemsPerLine);
  for (var i = 0; i < linesCount; ++i) {
    var offset = i * itemsPerLine;
    var from = Math.floor(Math.random() * count) * itemsPerElement;
    var to = Math.floor(Math.random() * count) * itemsPerElement;
    lines[offset + 0] = nodesData[from + 0];
    lines[offset + 1] = nodesData[from + 1];
    lines[offset + 2] = nodesData[to + 0];
    lines[offset + 3] = nodesData[to + 1];
  }
  var lineProgram = makeLineProgram(gl, lines, screen)

  var dx = 0.01
  nodeProgram.draw();
  lineProgram.draw();

  frame();

  function frame() {
    if (transform[12] > 1 || transform[12] < -1) {
      dx *= -1;
    }
    transform[12] += dx;
    gl.clear(gl.COLOR_BUFFER_BIT)
    lineProgram.draw();
    nodeProgram.draw();
    requestAnimationFrame(frame);
  }

}

function makeLineProgram(gl, data, options) {
  let lineVSShader = wgl.compile(gl, gl.VERTEX_SHADER, lineVSSrc);
  let lineFSShader = wgl.compile(gl, gl.FRAGMENT_SHADER, lineFSSrc);
  let lineProgram = wgl.link(gl, lineVSShader, lineFSShader);

  let locations = wgl.getLocations(gl, lineProgram);
  var linesCount = data.length / 4;
  var lineBuffer = gl.createBuffer();
  var bpe = data.BYTES_PER_ELEMENT;
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer)

  var api = {
    draw,
    updateTransform
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

  function updateTransform() {
    gl.useProgram(lineProgram);
    gl.uniformMatrix4fv(locations.uniforms.uTransform, false, options.transform);
    gl.uniform2f(locations.uniforms.uScreenSize, options.width, options.height);

    gl.drawArrays(gl.LINES, 0, linesCount * 2);
  }
}

function makeNodeProgram(gl, data, options) {
  let vertexShader = wgl.compile(gl, gl.VERTEX_SHADER, vertextShaderSrc);
  let fragmentShader = wgl.compile(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
  let vertexProgram = wgl.link(gl, vertexShader, fragmentShader);

  let locations = wgl.getLocations(gl, vertexProgram);
  var count = data.length / 6;

  var buffer = gl.createBuffer();
  if (!buffer) throw new Error('failed to create a nodesBuffer');

  var api = {
    draw,
    updateTransform
  };
  return api;

  function draw() {
    gl.useProgram(vertexProgram);

    var bpe = data.BYTES_PER_ELEMENT;

    gl.uniformMatrix4fv(locations.uniforms.uTransform, false, options.transform);
    gl.uniform2f(locations.uniforms.uScreenSize, options.width, options.height);

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

  function updateTransform() {
    draw()
    // gl.useProgram(vertexProgram);
    // gl.uniformMatrix4fv(locations.uniforms.uTransform, false, options.transform);
    // gl.uniform2f(locations.uniforms.uScreenSize, options.width, options.height);
    // gl.drawArrays(gl.POINTS, 0, count);
  }
}