export class Ray {
  constructor(origin, direction) {
    this.origin = origin;
    this.direction = direction;
  }

  pointAtParameter(t) {
    return this.origin.add(this.direction.multiply(t));
  }

  position(t) {
    return this.origin.add(this.direction.multiply(t));
  }

  transform(matrix) {
    return new Ray(matrix.multiply(this.origin), matrix.multiply(this.direction));
  }
}