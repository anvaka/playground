class Transform {
  constructor(scale, dx, dy) {
    scale = scale || 1;
    dx = dx || 0;
    dy = dy || 0;
    this._array = [
      scale, 0,  0, 0,
      0, scale,  0, 0,
      0, 0,  1, 0,
      dx, dy,  0, 1
    ]
  }

  applyTransform(other) {
    var scale = this.scale * other.scale;
    var dx = this.scale * other.dx + this.dx;
    var dy = this.scale * other.dy + this.dy;
    return new Transform(scale, dx, dy);
  }

  get scale() {
    return this._array[0];
  }

  get dx() {
    return this._array[12];
  }

  get dy() {
    return this._array[13];
  }

  set dx(newDx) {
    this._array[12] = newDx;
  }
  
  set dy(newDy) {
    this._array[13] = newDy;
  }

  set scale(newScale) {
    this._array[0] = newScale;
    this._array[5] = newScale;
  }


  getArray() {
    return this._array;
  }
}

module.exports = Transform;