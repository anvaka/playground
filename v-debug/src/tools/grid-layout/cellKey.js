/**
 *  Turns column/row into cell's identifier
 */
export default function cellKey(x, y) {
  return x + 'c;r' + y;
}
