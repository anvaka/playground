class WireAccessor {
  constructor(buffer, offset) {
    this.offset = offset;
    this.buffer = buffer;
  }

  update(from, to) {
    var buffer = this.buffer;
    var offset = this.offset;

    buffer[offset + 0] = from.x
    buffer[offset + 1] = from.y

    buffer[offset + 2] = to.x
    buffer[offset + 3] = to.y
  }
}

module.exports = WireAccessor;