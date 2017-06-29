module.exports = getBounds

function getBounds (rects) {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  rects.forEach(r => {
    const side = r.width

    if (r.cx - side / 2 < minX) minX = r.cx - side / 2
    if (r.cx + side / 2 > maxX) maxX = r.cx + side / 2

    if (r.cy - side / 2 < minY) minY = r.cy - side / 2
    if (r.cy + side / 2 > maxY) maxY = r.cy + side / 2
  })

  return { minX, minY, maxX, maxY }
}
