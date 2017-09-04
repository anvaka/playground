const getBBoxAndRects = require('./getBBoxAndRects');
const getDelaunayTesselation = require('./tesselation/getDelaunayTesselation');

module.exports = getTesselationLines;

function getTesselationLines(graph, layout, offset) {
  let {bbox, rects} = getBBoxAndRects(graph, layout);

  let delaunayGraph  = getDelaunayTesselation(rects);
  let lines = [];
  delaunayGraph.forEachLink(l => {
    let fromPos = delaunayGraph.getNode(l.fromId).data;
    let toPos = delaunayGraph.getNode(l.toId).data;

    lines.push({
      from: {
        x: offset.x + fromPos.x,
        y: offset.y + fromPos.y
      },
      to: {
        x: offset.x + toPos.x,
        y: offset.y + toPos.y,
      }
    })
  })

  return lines;
}