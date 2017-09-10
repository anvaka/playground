const ITEMS_PER_POINT = 6;  // x, y, size, r, g, b
var makeNodeProgram = require('./makePointsProgram');
var Element = require('./Element');
var Color = require('./Color');

class PointAccessor {
  constructor(buffer, offset, color, data) {
    this.offset = offset;
    this.buffer = buffer;
    this.color = color || new Color(1, 1, 1, 1); 
    if (data !== undefined) {
      this.data = data;
    }
  }

  get x() {
    return this.buffer[this.offset];
  }

  get y() {
    return this.buffer[this.offset + 1];
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

class PointCollection extends Element {
  constructor(capacity) {
    super();

    // TODO: Not sure I like this too much. But otherwise how can I track interactivity?
    this.pointsAccessor = [];

    this.capacity = capacity;
    this.pointsBuffer = new Float32Array(capacity * ITEMS_PER_POINT);
    this.count = 0;
    this._program = null;
    this.color = new Color(1, 1, 1, 1);
    this.size = 1;
  }

  addInteractiveElements(tree, dx, dy) {
    let t = this.transform;
    let points = this.pointsAccessor.map(p => ({
      x: p.x + dx + t.dx,
      y: p.y + dy + t.dy,
      p: p
    }))
    tree.addAll(points);
  }

  draw(gl, screen) {
    if (!this._program) {
      this._program = makeNodeProgram(gl, this.pointsBuffer);
    }

    this._program.draw(this.worldTransform, screen, this.count);
  }

  dispose() {
    if (this._program) {
      this._program.dispose();
      this._program = null;
    }
  }

  add(point, data) {
    if (!point) throw new Error('Point is required');

    if (this.count >= this.capacity)  {
      this._extendArray();
    }
    let pointsBuffer = this.pointsBuffer;
    let internalNodeId = this.count;
    let offset = internalNodeId * ITEMS_PER_POINT;
    let pointAccessor = new PointAccessor(pointsBuffer, offset, point.color || this.color, data);

    this.pointsAccessor.push(pointAccessor);

    pointAccessor.update(point, this)

    this.count += 1;
    return pointAccessor
  }

  _extendArray() {
    // This is because we would have to track every created point accessor
    // TODO: Welp, a week older you thinks that we should be tracking the points
    // for interactivity... So, might as well implement this stuff. Remember anything
    // about permature optimization?
    throw new Error('Cannot extend array at the moment :(')
  }
}

module.exports = PointCollection;