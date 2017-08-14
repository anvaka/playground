const ITEMS_PER_POINT = 6;  // x, y, size, r, g, b
var makeNodeProgram = require('./makePointsProgram');
var BBox = require('./BBox');

class Points {
  constructor(capacity) {
    this.capacity = capacity;
    this.points = new Float32Array(capacity * ITEMS_PER_POINT);
    this.count = 0;
    this._program = null;
    this.bbox = new BBox();
  }

  draw(gl, screen) {
    if (!this._program) {
      this._program = makeNodeProgram(gl, this.points, screen);
    }
    this._program.draw();
  }

  add(point) {
    if (!point) throw new Error('Point is required');

    if (this.count >= this.capacity)  {
      this._extendArray();
    }
    let points = this.points;
    let offset = this.count * ITEMS_PER_POINT;

    points[offset + 0] = point.x
    points[offset + 1] = point.y
    points[offset + 2] = point.size
    // TODO: This is waste
    var color = point.color;
    points[offset + 3] = color.r
    points[offset + 4] = color.g
    points[offset + 5] = color.b

    this.bbox.addPoint(point);
    this.count += 1;
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