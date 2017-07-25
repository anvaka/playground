module.exports = getLength;

function getLength(from, to) {
  let dx = from.x - to.x;
  let dy = from.y - to.y;
  return Math.sqrt(dx * dx + dy * dy);
}