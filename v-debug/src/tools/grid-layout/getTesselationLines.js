import getBBoxAndRects from './getBBoxAndRects';
import getDelaunayTesselation from './tesselation/getDelaunayTesselation';

export default getTesselationLines;

function getTesselationLines(graph, layout, offset) {
  let {bbox, rects} = getBBoxAndRects(graph, layout);

  let delaunayGraph = getDelaunayTesselation(rects, 10);
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