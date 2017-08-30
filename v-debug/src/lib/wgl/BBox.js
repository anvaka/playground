class BBox {
  constructor() {
    this.minX = Number.POSITIVE_INFINITY;
    this.minY = Number.POSITIVE_INFINITY;
    this.maxX = Number.NEGATIVE_INFINITY;
    this.maxY = Number.NEGATIVE_INFINITY;
  }

  growBy(offset) {
    this.minX -= offset;
    this.minY -= offset;
    this.maxX += offset;
    this.maxY += offset;
  }

  get left() {
    return this.minX;
  }

  get top() {
    return this.minY;
  }

  get right() {
    return this.maxX;
  }

  get bottom() {
    return this.maxY;
  }

  get width() {
    return this.maxX - this.minX;
  }

  get height() {
    return this.maxY - this.minY;
  }

  get cx() {
    return (this.minX + this.maxX)/2;
  }

  get cy() {
    return (this.minY + this.maxY)/2;
  }

  addPoint(point) {
    if (!point) throw new Error('Point is not defined');

    if (point.x < this.minX) this.minX = point.x;
    if (point.x > this.maxX) this.maxX = point.x;
    if (point.y < this.minY) this.minY = point.y;
    if (point.y > this.maxY) this.maxY = point.y;
  }

  merge(otherBBox) {
    if (otherBBox.minX < this.minX) this.minX = otherBBox.minX;
    if (otherBBox.minY < this.minY) this.minY = otherBBox.minY;
    if (otherBBox.maxX > this.maxX) this.maxX = otherBBox.maxX;
    if (otherBBox.maxY > this.maxY) this.maxY = otherBBox.maxY;
  }
}

module.exports = BBox;