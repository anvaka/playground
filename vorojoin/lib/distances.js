module.exports = {
  chebushev(a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1];
    return Math.max(Math.abs(dx), Math.abs(dy))
  },
  euclid(a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1];
    return Math.sqrt(dx * dx + dy * dy)
  }
}