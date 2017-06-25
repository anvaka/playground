class Triangle {
  constructor (p1, p2, p3) {
    this.p1 = p1
    this.p2 = p2
    this.p3 = p3

    this.path = `M${p1[0]},${p1[1]} L${p2[0]},${p2[1]} L${p3[0]},${p3[1]}`
  }

  getPath () {
    return this.path
  }
}

module.exports = Triangle
