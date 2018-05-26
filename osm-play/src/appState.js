var appState = {
  currentState: 'intro',
  chooseFrom: [],
  selected: null,
  point: null,
  downloadOsmProgress: null,
  getGraphBBox,
  getGraph,
  setGraph,
  startOver,
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
}

function startOver() {
  appState.currentState = 'intro';
  appState.selected =  null;
  appState.chooseFrom = [];
  appState.downloadOsmProgress = null;
}

export default appState;