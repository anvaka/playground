class Rect {
  constructor (params) {
    Object.assign(this, params)
  }

  get right () {
    return this.left + this.width
  }

  get bottom () {
    this.top + this.height
  }

  get cx () {
    return this.left + this.width / 2
  }

  get cy () {
    return this.top + this.height / 2
  }

  set cx (x) {
    this.left = x - this.width / 2
  }

  set cy (y) {
    this.top = y - this.height / 2
  }
}

module.exports = Rect
