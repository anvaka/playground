import { EPSILON } from './constants.js';

export class Color {
  constructor(r, g, b) {
    this.red = r;
    this.green = g;
    this.blue = b;
  }

  isEqual(other) {
    return Math.abs(this.red - other.red) < EPSILON &&
           Math.abs(this.green - other.green) < EPSILON &&
           Math.abs(this.blue - other.blue) < EPSILON;
  }

  add(other) {
    return new Color(this.red + other.red, this.green + other.green, this.blue + other.blue);
  }

  subtract(other) {
    return new Color(this.red - other.red, this.green - other.green, this.blue - other.blue);
  }

  multiply(scalar) {
    return new Color(this.red * scalar, this.green * scalar, this.blue * scalar);
  }

  hadamardProduct(other) {
    return new Color(this.red * other.red, this.green * other.green, this.blue * other.blue);
  }
}