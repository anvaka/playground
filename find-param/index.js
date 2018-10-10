var isect = require('isect');
var createForceLayout = require('ngraph.forcelayout');

for (var j = 0; j < 1; ++j) {
var graph = require('ngraph.fromdot')(require('./data/anvaka.dot'))
var layout = createForceLayout(graph, {
  springLength: 30,
  springCoeff: 0.0008,
  gravity: -1.2,
  theta: 0.8,
  dragCoeff: 0.02,
  timeStep : 20 - j // / (j + 1),
});

// pre phase
// for (var i = 0; i < 20; ++i) layout.step();

for (var i = 0; i < 300; ++i) {
  layout.step();
  // if (i % 50 === 0) console.log(measureLayoutCoeff());
}
console.log(measureLayoutCoeff());

function measureLayoutCoeff() {
  var lines = [];
  graph.forEachLink(link => {
    var fp = layout.getNodePosition(link.fromId);
    var tp = layout.getNodePosition(link.toId);
    lines.push({
      from: {x: fp.x, y: fp.y},
      to: {x: tp.x, y: tp.y}
    });
  })
  var foundCount = 0;
  isect.bush(lines, {
    onFound() {
      foundCount += 1;
    }
  }).run()
  return foundCount/(lines.length * (lines.length - 1));
}
}