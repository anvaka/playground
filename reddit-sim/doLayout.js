const argv = require('yargs').argv

const fs = require('fs');
const fromDot = require('ngraph.fromdot');
const fileName = argv.graph || './graph.dot';
console.log(fileName);
const createLayout = require('ngraph.forcelayout');

let graph = fromDot(fs.readFileSync(fileName, 'utf8'))
let layout = createLayout(graph, {
  springLength: 30,
  springCoeff: 0.0008,
  gravity: -1.2,
  theta: 0.8,
  dragCoeff: 0.02,
  timeStep: 20
});
var detectClusters  = require('ngraph.louvain');

var clusters = detectClusters(graph);
graph.forEachLink(link => {
  let spring = layout.getSpring(link.fromId, link.toId);
  let sameClass = clusters.getClass(link.fromId) === clusters.getClass(link.toId);
  if (sameClass) {
    spring.length = 30;
    spring.coeff = 1;
  } else {
    spring.coeff = 0.0001;
  }
})

// let preprocessor = createPreprocessor(graph);
// console.log('Preprocessing graph');
// for (let i = 0; i < 100; ++i) {
//   preprocessor.step();
//   if (i % 10 === 0) saveFile('preprocess' + i + '.json', (id) => preprocessor.getNodePosition(id));
// }

// graph.forEachNode(n => {
//   let p = preprocessor.getNodePosition(n.id);
//   layout.setNodePosition(n.id, p.x, p.y);
// });

for (let i = 0; i < 700; ++i) {
  console.log('step ' + i);
  layout.step();
  if (i % 100 === 0) {
    saveFile('layout' + i + '.json', (id) => layout.getNodePosition(id));
  }
}
saveFile('final_layout.json', (id) => layout.getNodePosition(id))

function saveFile(name, getNodePosition) {
  let positions = [];

  graph.forEachNode(n => {
    let pos = getNodePosition(n.id);
    positions.push(round(pos.x), round(pos.y), clusters.getClass(n.id), n.id);
  });

  fs.writeFileSync(name, JSON.stringify(positions));
}

function round(x) {
  return Math.round(x * 1000)/1000;
}
