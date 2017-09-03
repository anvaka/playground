module.exports = cellKey;

/**
 *  Turns column/row into cell's identifier
 */
function cellKey(col, row) {
  return col + 'c;r' + row;
}
