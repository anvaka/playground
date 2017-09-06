module.exports = cellKey;

/**
 *  Turns column/row into cell's identifier
 */
function cellKey(x, y) {
  return x + 'c;r' + y;
}
