const ITEMS_PER_LINE = 4;  // x0, y0, x1, y1
var makeLinesProgram = require('./makeLinesProgram');
var Color = require('./Color');
var Element = require('./Element');

const DEFAULT_COLOR =  new Color(1, 1, 1, 1);

class LineAccessor {
  constructor(buffer, offset) {
    this.offset = offset;
    this.buffer = buffer;
  }

  update(from, to) {
    var buffer = this.buffer;
    var offset = this.offset;
    buffer[offset + 0] = from.x
    buffer[offset + 1] = from.y
    buffer[offset + 2] = to.x
    buffer[offset + 3] = to.y
  }
}

class Lines extends Element {
  constructor(capacity) {
    super();

    this.capacity = capacity;
    this.buffer = new Float32Array(capacity * ITEMS_PER_LINE);
    this.count = 0;
    this._program = null;
    this.color = DEFAULT_COLOR;
  }

  draw(gl, screen) {
    if (!this._program) {
      this._program = makeLinesProgram(gl, this.buffer, screen);
    }

    this._program.draw(this.worldTransform, this.color);
  }

  add(line) {
    if (!line) throw new Error('Line is required');

    if (this.count >= this.capacity)  {
      this._extendArray();
    }
    let offset = this.count * ITEMS_PER_LINE;
    let lineAccessor = new LineAccessor(this.buffer, offset);
    lineAccessor.update(line.from, line.to)

    this.count += 1;
    return lineAccessor;
  }

  _extendArray() {
    // Every time we run out of space create new array twice bigger.
    var newCapacity = this.capacity * ITEMS_PER_LINE * 2;
    var extendedArray = new Float32Array(newCapacity);
    extendedArray.set(this.points);

    this.points = extendedArray;
    this.capacity = newCapacity;
  }
}

module.exports = Lines;