const ITEMS_PER_POINT = 6;  // x, y, size, r, g, b
var makeNodeProgram = require('./makePointsProgram');
var Element = require('./Element');
var Color = require('./Color');

class PointAccessor {
  constructor(buffer, offset, color) {
    this.offset = offset;
    this.buffer = buffer;
    this.color = color || new Color(1, 1, 1, 1); 
  }

  update(point, defaults) {
    var offset = this.offset;
    var points = this.buffer;

    points[offset + 0] = point.x
    points[offset + 1] = point.y
    if (point.size || defaults) {
      points[offset + 2] = typeof point.size === 'number' ? point.size : defaults.size;
    }

    this.setColor(this.color);
  }

  setColor(color) {
    this.color = color;
    // TODO: This is waste, we can store rgba in 32 bits, not in the 3 * 3 * 8 bits?
    this.buffer[this.offset + 3] = color.r
    this.buffer[this.offset + 4] = color.g
    this.buffer[this.offset + 5] = color.b
  }
}

class Points extends Element {
  constructor(capacity) {
    super();

    this.capacity = capacity;
    this.points = new Float32Array(capacity * ITEMS_PER_POINT);
    this.count = 0;
    this._program = null;
    this.color = new Color(1, 1, 1, 1);
    this.size = 1;
  }

  draw(gl, screen) {
    if (!this._program) {
      this._program = makeNodeProgram(gl, this.points);
    }

    this._program.draw(this.worldTransform, screen);
  }

  dispose() {
    if (this._program) {
      this._program.dispose();
      this._program = null;
    }
  }

  add(point) {
    if (!point) throw new Error('Point is required');

    if (this.count >= this.capacity)  {
      this._extendArray();
    }
    let points = this.points;
    let internalNodeId = this.count;
    let offset = internalNodeId * ITEMS_PER_POINT;
    let pointAccessor = new PointAccessor(points, offset, this.color);
    pointAccessor.update(point, this)
    this.count += 1;
    return pointAccessor
  }

  _extendArray() {
    // Every time we run out of space create new array twice bigger.
    var newCapacity = this.capacity * ITEMS_PER_POINT * 2;
    var extendedArray = new Float32Array(newCapacity);
    extendedArray.set(this.points);

    this.points = extendedArray;
    this.capacity = newCapacity;
  }
}

module.exports = Points;