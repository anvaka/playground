import getMemoryInfo from './lib/getMemoryInfo';

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
  backgroundColor: {
    r: 255, g: 255, b: 255, a: 1
  },
  lineColor: {
    r: 22, g: 22, b: 22, a: 1
  },
  memoryInfo: getMemoryInfo()
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