var appState = {
  currentState: '',
  chooseFrom: [],
  selected: null,
  getGraphBBox,
  getGraph,
  setGraph
};

var graph;
var graphWidth;

function getGraphBBox() {
  return {width: graphWidth};
}

function getGraph() {
  return graph;
}

function setGraph(newGraph, bounds) {
  graph = newGraph;
  var w = bounds.width;
  var h = bounds.height;
  graph.forEachNode(node => {
    node.data.x -= bounds.minX - w/2;
    node.data.y -= bounds.minY - h/2;
  })
  graphWidth = Math.max(w, h);
}


export default appState;