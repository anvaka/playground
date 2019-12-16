/**
 * Load your graph here.
 */
// https://github.com/anvaka/miserables
import miserables from 'miserables';

// Other loaders: 
// https://github.com/anvaka/ngraph.generators
import generate from 'ngraph.generators';
import forceLayout from 'ngraph.forcelayout';

// https://github.com/anvaka/ngraph.graph
import createGraph from 'ngraph.graph';

// https://github.com/anvaka/ngraph.fromjson
// import fromjson from 'ngraph.fromjson'

// https://github.com/anvaka/ngraph.fromdot
// import fromdot from 'ngraph.fromdot'

export default function getGraph() {
  const graph = generate.grid3(10, 10, 5)
  return graph
  // return graph;//
  // let layout = forceLayout(graph);
  // for (let i = 0; i < 200; ++i) layout.step();

  // let finalGraph = createGraph();
  // graph.forEachLink(function(link) {
  //   let fromPos = layout.getNodePosition(link.fromId);
  //   let toPos = layout.getNodePosition(link.toId);
  //   finalGraph.addLink(fromPos.x, toPos.x);
  //   finalGraph.addLink(fromPos.y, toPos.y);
  // });

  // return finalGraph;

  // return miserables.create();
  //return generate.wattsStrogatz(20, 5, 0.4);
}

