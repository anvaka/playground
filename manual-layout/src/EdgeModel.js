export default class EdgeModel {
  constructor (from, to) {
    this.from = from
    this.to = to
  }

  getPath () {
    return `M${this.from.cx},${this.from.cy} L${this.to.cx},${this.to.cy}`
  }
}
