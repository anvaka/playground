module.exports = isSamePoint;

function isSamePoint(p0, p1) {
  return Math.abs(p0.x - p1.x) < 1e-5 && Math.abs(p0.y - p1.y) < 1e-5;
}