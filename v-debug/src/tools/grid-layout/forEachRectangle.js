const Rect = require('../../lib/Rect');

module.exports = forEachRectangleNode

function forEachRectangleNode(graph, layout, callback) {
  graph.forEachNode(node => {
    let pos = layout.getNodePosition(node.id);
    let size = (node.data.size || 20)/2
    callback(new Rect({
      id: node.id,
      left: pos.x - size,
      top: pos.y - size,
      width: 2 * size,
      height: 2 * size,
    }));
  });
}