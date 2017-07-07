module.exports = getLayoutDimensions;

function getLayoutDimensions(info) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  let layout = info.layout;
  let graph = info.graph;

  graph.forEachNode(function(node) {
    let pos = layout.getNodePosition(node.id);
    if (pos.x < minX) minX = pos.x;
    if (pos.x > maxX) maxX = pos.x;
    if (pos.y < minY) minY = pos.y;
    if (pos.y > maxY) maxY = pos.y;
  });

  info.layoutDimensions = {
    minX, minY, maxX, maxY,
    width: maxX - minX,
    height: maxY - minY
  };

  return info;
}
