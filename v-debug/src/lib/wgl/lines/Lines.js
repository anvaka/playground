var BaseLines = require('./BaseLines');
var makeLinesProgram = require('./makeLinesProgram');
var LineAccessor = require('./LineAccessor');

/**
 * Lines have varying thickness. That comes at extra price: Each line
 * requires additional space in buffer, as it is rendered as triangles
 */
class Lines extends BaseLines {
  constructor(capacity) {
    super(capacity, 12); // items per thick line
  }

  _makeProgram(gl) {
    return makeLinesProgram(gl, this.buffer, /* drawTriangles = */ true);
  }

  _addInternal(line, offset) {
    // TODO: width
    let lineUI = new LineAccessor(this.buffer, offset);
    lineUI.update(line.from, line.to)
    return lineUI;
  }
}

module.exports = Lines;