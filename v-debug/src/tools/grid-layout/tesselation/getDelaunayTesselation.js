module.exports = getDelaunayTesselation;

const getDelaunayGraph = require('../../../lib/geom/getDelaunayGraph');

/**
 * Extends rectangls with control points and returns delaunay
 * graph.
 */
function getDelaunayTesselation(rectangles) {
  let vertices = getPositions(rectangles);

  return getDelaunayGraph(vertices, p => p.x, p => p.y);
}

function getPositions(rectangles) {
  const positions = [];

  rectangles.forEach(r => {
    let x = r.cx;
    let y = r.cy;
    positions.push({
      x: x,
      y: y,
      src_key: r.id,
      id: r.id
    });
    const extended = true;

    if (extended) {
      positions.push({
        id: r.id + '_0',
        src_key: r.id,
        x: r.left,
        y: r.top
      }, {
        id: r.id + '_1',
        src_key: r.id,
        x: r.right,
        y: r.bottom
      }, {
        id: r.id + '_2',
        src_key: r.id,
        x: r.right,
        y: r.top
      }, {
        id: r.id + '_3',
        src_key: r.id,
        x: r.left,
        y: r.bottom
      });
    }
  });

  positions.forEach(gridify);
  return positions;
}

function gridify(p) {
  let size = 10;
  p.x = Math.round(p.x/size) * size;
  p.y = Math.round(p.y/size) * size;
}