module.exports = makeBuffer;

function makeBuffer(width, height) {
  var rows = new Array(height);
  for (var y = 0; y < height; ++y) {
    rows[y] = new Uint32Array(width);
  }

  return {
    get: get,
    set: set
  };

  function get(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0

    return rows[y][x];
  }

  function set(x, y, v) {
    rows[y][x] = v;
  }
}
