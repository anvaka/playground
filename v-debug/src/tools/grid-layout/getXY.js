module.exports = function getXY(a) {
  return a.split(',').map(v => Number.parseFloat(v));
}