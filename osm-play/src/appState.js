var appState = {
  currentState: 'intro',
  selected: null,
  blank: false,
  point: null,
  downloadOsmProgress: null,
  building: false,
  buildingMessage: '',
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
  appState.blank = false,
  appState.downloadOsmProgress = null;
}

export default appState;