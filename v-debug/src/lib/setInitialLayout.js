module.exports = setInitalLayout;

var randomIterator = require('ngraph.random').randomIterator

function setInitalLayout(graph, layout) {
  var nodes = [];
  var positions = new Map();
  graph.forEachNode(node => {
    nodes.push(node)
    var pos = layout.getNodePosition(node.id);
    positions.set(node.id, pos);
  })

  var targetDistance = 100;
  nodes.sort((x, y) => {
    if (!x.links && !y.links) return 0;
    if (!x.links) return 1;
    if (!y.links) return -1;

    return y.links.length - x.links.length;
  })
  var touched = new Set();
  nodes.forEach((node) => {
    if (!node.links) return;
    layoutAround(node, targetDistance);
  })

  function layoutAround(node, baseDist) {
    var linksCount = node.links.length;
    var angleStep = linksCount / (2 * Math.PI);
    var startIdx = Math.random() * 100;

    node.links.forEach((link, i) => {
      var {fromId, toId} = link;
      if (toId === node.id) {
        var t = toId;
        var toId = fromId;
        var fromId = t;
      }
      if (touched.has(toId)) return;

      layout.setNodePosition(toId,
         baseDist * Math.cos((i + startIdx) * angleStep),
         baseDist * Math.sin((i + startIdx) * angleStep)
      );

      touched.add(toId);
    });
  }
   var iterator = randomIterator(nodes);

   step();

  function step() {
    iterator.forEach(node => {
      if (!node.links) return;

      node.links.forEach(link => {
        var {fromId, toId} = link;
        if (toId === node.id) {
          var t = toId;
          var toId = fromId;
          var fromId = t;
        }

        var from = layout.getNodePosition(fromId);
        var to = layout.getNodePosition(toId);

        var dx = to.x - from.x;
        var dy = to.y - from.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 1e-5) return;
        var nx = dx/d;
        var ny = dy/d;
        var x = from.x + targetDistance * nx;
        var y = from.y + targetDistance * ny;
        if (Number.isNaN(x) || Number.isNaN(y)) debugger;
        layout.setNodePosition(toId, x, y);
      })
    })
  }
}