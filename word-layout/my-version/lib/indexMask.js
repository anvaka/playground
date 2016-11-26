module.exports = indexMask;

function indexMask(mask) {
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
    return index.has(getHash(x, y));
  }

  function occupyCell(x, y) {
    var hashKey = getHash(x, y);
    index.delete(hashKey);
  }

  function buildIndex(mask) {
    var index = new Map();
    var width = mask.width;
    var height = mask.height;
    var occupied = mask.occupied;

    for (var y = 0; y < height; ++y) {
      var offset = y * width;
      for (var x = 0; x < width; ++x) {
        if (!occupied[offset + x]) {
          index.set(getHash(x, y), {
            x: x,
            y: y
          });
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


