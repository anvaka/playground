module.exports = indexMask;

function indexMask(mask) {
  var width = mask.width;
  var height = mask.height;
  var occupied = mask.occupied;

  var index = buildIndex(mask);

  return {
    forEachFreeCell: forEachFreeCell,
    occupyCell: occupyCell,
    isFreeCell: isFreeCell,

    width: mask.width,
    height: mask.height,
    occupied: mask.occupied
  }

  function forEachFreeCell(visitCallback) {
    index.forEach(function(cell) {
      visitCallback(cell.x, cell.y);
    });
  }

  function isFreeCell(x, y) {
    return occupied[y * width + x] === 0;
  }

  function occupyCell(x, y) {
    var hashKey = getHash(x, y);
    index.delete(hashKey);
  }

  function buildIndex() {
    var index = new Map();

    for (var y = 0; y < height; ++y) {
      var offset = y * width;
      for (var x = 0; x < width; ++x) {
        if (!occupied[offset + x]) {
          var key = getHash(x, y);
          var value = {
            x: x,
            y: y
          };
          index.set(key, value);
        }
      }
    }

    return index;
  }
}

function getHash(x, y) {
  var s = x + y;
  return s * (s + 1) / 2 + x;
}


