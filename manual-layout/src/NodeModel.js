class NodeModel {
  constructor (node) {
    this.id = node.id
    this.cx = node.x
    this.cy = node.y
    this.width = node.width
    this.height = node.height
    this.highlighted = false
    this.selected = false
    this.fontSize = node.fontSize
  }

  get right () {
    return this.cx + this.width / 2
  }

  get bottom () {
    return this.cy + this.height / 2
  }

  get left () {
    return this.cx - this.width / 2
  }

  get top () {
    return this.cy - this.height / 2
  }
}

module.exports = NodeModel
