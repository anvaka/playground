import {utils} from 'w-gl';
import shaderGraph from 'w-gl/src/shaderGraph/index.js';
import panzoomVS from 'w-gl/src/shaderGraph/panzoom.js';

export default makeLineProgram;


const lineVSSrc = shaderGraph.getVSCode([
  panzoomVS
]);

const lineFSSrc = `
precision highp float;
uniform vec4 uColor;
void main() {
  gl_FragColor = uColor;
}
`;

let lineProgramCache = new Map();

function makeLineProgram(gl, data) {
  let lineProgram = lineProgramCache.get(gl)
  if (!lineProgram) {
    var lineVSShader = utils.compile(gl, gl.VERTEX_SHADER, lineVSSrc);
    var lineFSShader = utils.compile(gl, gl.FRAGMENT_SHADER, lineFSSrc);
    lineProgram = utils.link(gl, lineVSShader, lineFSShader);
    lineProgramCache.set(gl, lineProgram);
  }

  var locations = utils.getLocations(gl, lineProgram);

  var lineBuffer = gl.createBuffer();

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

  function draw(transform, color, screen, startFrom, madeFullCircle) {
    if (data.length === 0) return;

    gl.useProgram(lineProgram);

    const transformArray = transform.getArray();
    gl.uniformMatrix4fv(locations.uniforms.uTransform, false, transformArray);
    gl.uniform2f(locations.uniforms.uScreenSize, screen.width, screen.height);
    gl.uniform4f(locations.uniforms.uColor, color.r, color.g, color.b, color.a);

    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.enableVertexAttribArray(locations.attributes.aPosition)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(locations.attributes.aPosition, 2, gl.FLOAT, false, 0, 0)

    if (madeFullCircle) {
      let elementsCount = ((data.length) / 2) - startFrom;
      gl.drawArrays(gl.LINE_STRIP, startFrom, elementsCount); 
      if (startFrom > 1) gl.drawArrays(gl.LINE_STRIP, 0, startFrom - 1); 
    } else {
      gl.drawArrays(gl.LINE_STRIP, 1, startFrom - 1); 
    }
  }
}