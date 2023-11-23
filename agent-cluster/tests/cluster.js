import { test } from 'tap';
import miserables from 'miserables';
import clusterGraph from '../index.js';
import todot from 'ngraph.todot';

const availableColors = [
  0xff0000ff,
  0x00FF00ff,
  0x00FFFfff,
  0xFF00FFff,
  0xFFFF00ff,
  0x0000FFff,
]

test('it can cluster', (t) => {
  let graph = miserables;
  const clusters = clusterGraph(graph);
  let colorIndex = 0;
  clusters.forEach(nodes => {
    if (nodes.length < 2) return;
    nodes.forEach(nodeId => {
      const node = graph.getNode(nodeId);
      node.data.color = availableColors[colorIndex % availableColors.length];
    })
    colorIndex += 1;
  });
  console.log(todot(graph));
  t.ok();
});
