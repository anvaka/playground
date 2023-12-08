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
const randomWalkLength = numberOrDefault(process.argv[2], 10);
const randomWalkCount = numberOrDefault(process.argv[3], 100);
const clusters = clusterGraph(graph, randomWalkLength, randomWalkCount);
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
let dotContent = todot(graph);
console.log(dotContent);

function numberOrDefault(value, defaultValue) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10);
  return defaultValue;
}