class Color {
  constructor(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a === undefined ? 1 : a
  }
}

module.exports = Color;