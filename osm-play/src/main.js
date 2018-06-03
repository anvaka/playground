/* global mapboxgl */
import * as osm from './lib/osm';
import appState from './appState';
import bus from './bus';
import constructGraph from './lib/constructGraph';
import createBoundaryHighlighter from './lib/createBoundaryHighlighter';
import formatNumber from './lib/formatNumber';
import getMemoryInfo from './lib/getMemoryInfo';

require.ensure('@/vueApp.js', () => {
  // Settings UI is ready, initialize vue.js application
  require('@/vueApp.js');
});

var map = new mapboxgl.Map({
    container: 'map',
    style: './static/style.json',
    center: [8.538961,47.372476],
    zoom: 2,
    hash: true
});

const highlighter = createBoundaryHighlighter(map);

map.addControl(new mapboxgl.NavigationControl({
  showCompass: false
}));

var scrollingDiv = document.body;
scrollingDiv.addEventListener('touchmove', function(event){
    event.stopPropagation();
});

bus.on('highlight-bounds', (el) => {
  highlighter.highlight(el.id, el.bounds);
});

bus.on('download-roads', (el) => {
  downloadRoads(el.id);
});

bus.on('start-over', () => {
  highlighter.removeHighlight();
  appState.startOver();
})

bus.on('download-all-roads', () => {
  const bounds = map.getBounds();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast()
  const boundingBox = `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`;
  appState.building = true;
  appState.buildingMessage = 'Sending query to OSM...'
  appState.blank = false;

  const downloadPromise = osm.getRoadsInBoundingBox(boundingBox, progress);
  renderAfterResolution(downloadPromise, el => {
    return el.lon >= sw.lng && el.lon <= ne.lng &&
           el.lat >= sw.lat && el.lat <= ne.lat;
  });

  function progress(p) {
    let loaded = formatNumber(p.loaded);

    if (p.lengthComputable) {
      let total = formatNumber(p.total);
      appState.buildingMessage = `Downloading data: ${p.percent * 100}% (${loaded} of ${total} bytes)`;
    } else {
      appState.buildingMessage = `Downloading data: ${loaded} bytes so far...`;
    }
  }
});

function downloadRoads(relId) {
  renderAfterResolution(osm.getRoadsInRelationship(relId));
}

function renderAfterResolution(promise, filter) {
  promise.then(osmResponse => {
    return constructGraph(osmResponse, filter, updateConstructionProgress);
  }).then(({graph, bounds}) => {
    appState.setGraph(graph, bounds);
    appState.building = false;

    if (graph.getLinksCount() === 0) {
      appState.blank = true;
    } else {
      appState.currentState = 'canvas';
      appState.blank = false;
      bus.fire('graph-loaded');
    }
  });
}

function updateConstructionProgress(current, total, kind) {
  let totalStr = formatNumber(total);
  let currentStr = formatNumber(current);
  if (kind === 'graph') {
    appState.buildingMessage = `Making graph: ${currentStr} of ${totalStr} records`;
  } else {
    appState.buildingMessage = `Computing bounds: ${currentStr} of ${totalStr} records`;
  }
  if (appState.memoryInfo) {
    appState.memoryInfo = getMemoryInfo();
  }
}