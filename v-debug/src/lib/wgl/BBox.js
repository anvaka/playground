class BBox {
  constructor() {
    this.minX = 0;
    this.minY = 0;
    this.maxX = 0;
    this.maxY = 0;
  }

  get left() {
    return this.minX;
  }

  get top() {
    return this.minY;
  }

  get width() {
    return this.maxX - this.minX;
  }

  get height() {
    return this.maxY - this.minY;
  }

  addPoint(point) {
    if (!point) throw new Error('Point is not defined');

    if (point.x < this.minX) this.minX = point.x;
    if (point.x > this.maxX) this.maxX = point.x;
    if (point.y < this.minY) this.minY = point.y;
    if (point.y > this.maxY) this.maxY = point.y;
  }

  merge(other) {
    if (other.minX < this.minX) this.minX = other.minX;
    if (other.minY < this.minY) this.minY = other.minY;
    if (other.maxX > this.maxX) this.maxX = other.maxX;
    if (other.maxY > this.maxY) this.maxY = other.maxY;
  }
}

module.exports = BBox;