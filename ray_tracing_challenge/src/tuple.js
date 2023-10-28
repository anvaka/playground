const EPSILON = 0.00001;
export class Tuple {
  constructor(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  add(other) {
    return new Tuple(this.x + other.x, this.y + other.y, this.z + other.z, this.w + other.w);
  }

  subtract(other) {
    return new Tuple(this.x - other.x, this.y - other.y, this.z - other.z, this.w - other.w);
  }

  negate() {
    return new Tuple(-this.x, -this.y, -this.z, -this.w);
  }

  multiply(scalar) {
    return new Tuple(this.x * scalar, this.y * scalar, this.z * scalar, this.w * scalar);
  }

  divide(scalar) {
    return new Tuple(this.x / scalar, this.y / scalar, this.z / scalar, this.w / scalar);
  }

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  }

  normalize() {
    const magnitude = this.magnitude();
    return new Tuple(this.x / magnitude, this.y / magnitude, this.z / magnitude, this.w / magnitude);
  }

  dot(other) {
    return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w;
  }

  isStrictEqual(other) {
    return this.x === other.x && this.y === other.y && this.z === other.z && this.w === other.w;
  }

  isEqual(other) {
    return Math.abs(this.x - other.x) < EPSILON &&
           Math.abs(this.y - other.y) < EPSILON &&
           Math.abs(this.z - other.z) < EPSILON &&
           Math.abs(this.w - other.w) < EPSILON;
  }

  isPoint() {
    return this.w === 1.0;
  }

  isVector() {
    return this.w === 0.0;
  }
}

export class Point extends Tuple {
  constructor(x, y, z) {
    super(x, y, z, 1.0);
  }
}

export class Vector extends Tuple {
  constructor(x, y, z) {
    super(x, y, z, 0.0);
  }

  cross(other) {
    return new Vector(this.y * other.z - this.z * other.y,
                      this.z * other.x - this.x * other.z,
                      this.x * other.y - this.y * other.x);
  }
}