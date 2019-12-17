// const ratio = 540/230 - mug
const appState = {
  currentState: 'intro',
  lineDensity: 20,
  smoothSteps: 8,
  mapOpacity: 100,
  heightScale: 84,
  oceanLevel: 0,
  selected: null,
  aboutVisible: false,
  blank: false,
  error: null,
  kmlLayers: [],
  currentScript: 'roads',
  showZoomWarning: false,
  possibleScripts: {
    selected: 'roads',
    options: [{
      value: 'roads',
      text: 'Roads'
    }, {
      value: 'buildings',
      text: 'Buildings'
    }, {
      value: 'rivers',
      text: 'Rivers'
    }]
  },
  downloadOsmProgress: null,
  building: false,
  buildingMessage: '',
  zazzleLink: null,
  showCancelDownload: false,
  getGraphBBox,
  getGraph,
  setGraph,
  startOver,
  generatingPreview: false,

  backgroundColor: {
    r: 255, g: 255, b: 255, a: 1
  },
  lineColor: {
    r: 22, g: 22, b: 22, a: 0.85
  },

  getProjector,

  addKMLLayer,
};

var graph;
var graphBounds;
// projects lon/lat into current XY plane
var projector;

function getGraphBBox() {
  return graphBounds;
}

function getGraph() {
  return graph;
}

function setGraph(newGraph, bounds, newProjector) {
  graph = newGraph;
  graphBounds = bounds;
  projector = newProjector;
}

function getProjector() {
  return projector;
}

function startOver() {
  appState.zazzleLink = null;
  appState.generatingPreview = false;
  appState.currentState = 'intro';
  appState.blank = false,
  appState.downloadOsmProgress = null;
  appState.kmlLayers = [];
}


function addKMLLayer(name, layer) {
  appState.kmlLayers.push(makeKMLLayerViewModel(name, layer));
}

export default appState;

function makeKMLLayerViewModel(name, layer) {
  const viewModel = {
    name,
    color: layer.color,
    width: layer.width,
    updateColor() {
      layer.updateColor(viewModel.color);
    },

    getKMLLayer() { return layer }
  }

  return viewModel;
}