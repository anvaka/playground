export default class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  norm() {
    var l = this.length();
    return new Vector(this.x/l, this.y / l);
  }
  add(other) {
    return new Vector(this.x + other.x, this.y + other.y);
  }
  div(scalar) {
    return new Vector(this.x/scalar, this.y/scalar);
  }
  
  mul(scalar) {
    return new Vector(this.x * scalar, this.y * scalar);
  }
  
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  
  distanceTo(x, y) {
    var dx = x - this.x;
    var dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  distanceSquaredTo(x, y) {
    var dx = x - this.x;
    var dy = y - this.y;
    return (dx * dx + dy * dy);
  }
}