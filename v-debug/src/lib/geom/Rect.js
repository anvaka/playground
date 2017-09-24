/**
 * A rectangle.
 */
class Rect {
  constructor (params) {
    Object.assign(this, params)
    if (!isNumber(this.left)) throw new Error('Left is wrong')
    if (!isNumber(this.top)) throw new Error('top is wrong')
    if (!isNumber(this.width)) throw new Error('width is wrong')
    if (!isNumber(this.height)) throw new Error('height is wrong')
  }

  get right () {
    return this.left + this.width
  }

  get bottom () {
    return this.top + this.height
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

function isNumber (x) {
  if (!Number.isFinite(x)) return false
  return true
}
