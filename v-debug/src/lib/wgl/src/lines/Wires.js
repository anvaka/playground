var BaseLines = require('./BaseLines');
var makeLinesProgram = require('./makeLinesProgram');
var WireAccessor = require('./WireAccessor');

/**
 * Unlike lines, wires do not have width, and are always 1px wide, regardless
 * of resolution.
 */
class Wires extends BaseLines {
  constructor(capacity) {
    super(capacity, 4); // items per wire
  }

  _makeProgram(gl) {
    return makeLinesProgram(gl, this.buffer, /* drawTriangles = */ false);
  }

  _addInternal(line, offset) {
    let lineUI = new WireAccessor(this.buffer, offset);
    lineUI.update(line.from, line.to)
    return lineUI;
  }
}

module.exports = Wires;