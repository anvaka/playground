export default class Triangle {
  constructor (p1, p2, p3) {
    this.path = `M${p1[0]},${p1[1]} L${p2[0]},${p2[1]} L${p3[0]},${p3[1]}`
  }

  getPath () {
    return this.path
  }
}
