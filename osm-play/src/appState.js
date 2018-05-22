var appState = {
  currentState: '',
  chooseFrom: [],
  selected: null,
  getGraphBBox,
  getGraph,
  setGraph
};

var graph;
var graphBounds;

function getGraphBBox() {
  return graphBounds;
}

function getGraph() {
  return graph;
}

function setGraph(newGraph, bounds) {
  graph = newGraph;
  graphBounds = bounds;
  // graph.forEachNode(node => {
  //   node.data.x -= bounds.minX - w/2;
  //   node.data.y -= bounds.minY - h/2;
  // })
  // graphWidth = Math.max(w, h);
}


export default appState;