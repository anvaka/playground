import miserables from 'miserables';
import clusterGraph from '../index.js';
import todot from 'ngraph.todot';

const availableColors = [
  '#ff0000',
  '#00FF00',
  '#00FFFf',
  '#FF00FF',
  '#FFFF00',
  '#0000FF',
]

let graph = miserables;
const clusters = clusterGraph(graph);
let colorIndex = 0;
graph.forEachLink(link => {
  delete link.data;
})
let foundNodes = new Set();
clusters.forEach(nodes => {
  if (nodes.length < 2) return;
  nodes.forEach(nodeId => {
    const node = graph.getNode(nodeId);
    if (foundNodes.has(nodeId)) {
      console.warn('duplicate node', nodeId);
      return;
    }
    foundNodes.add(nodeId);
    node.data.color = availableColors[colorIndex % availableColors.length];
  })
  colorIndex += 1;
});

console.log(todot(graph));
