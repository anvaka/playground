/* global mapboxgl */
import * as osm from './lib/osm';
import appState from './appState';
import bus from './bus';
import BBox from './lib/bbox';
import createProjector from './lib/createProjector';
import createBoundaryHighlighter from './lib/createBoundaryHighlighter';

var createGraph = require('ngraph.graph');

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

// map.on('click', function(e) {
//   highlighter.removeHighlight();

//   appState.currentState = 'loading-regions';
//   appState.point = e.lngLat.lat + ', ' + e.lngLat.lng
//   appState.selected = null;

//   osm.getAreasAround(e.lngLat, map.getBounds())
//     .then(showRegionOptions) 
//     .catch(error => console.error(error))
// });

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

  const downloadPromise = osm.getRoadsInBoundingBox(boundingBox);
  renderAfterResolution(downloadPromise, el => {
    return el.lon >= sw.lng && el.lon <= ne.lng &&
           el.lat >= sw.lat && el.lat <= ne.lat;
  });
});

function downloadRoads(relId) {
  renderAfterResolution(osm.getRoadsInRelationship(relId));
}

function renderAfterResolution(promise, filter) {
  var lonLatBbox = new BBox();

  promise.then(d => {
    d.elements.forEach(element => {
      if (element.type === 'node') {
        lonLatBbox.addPoint(element.lon, element.lat);
      }
    });
    return d;
  })
  .then(d => {
    var graph = createGraph();
    var project = createProjector(lonLatBbox);
    var offset = new BBox();

    d.elements.forEach(element => {
      if (element.type === 'node') {
        if (filter && !filter(element)) {
          return;
        }
        var nodeData = project(element.lon, element.lat);
        offset.addPoint(nodeData.x, nodeData.y);
        graph.addNode(element.id, nodeData)
      } else if (element.type === 'way') {
        element.nodes.forEach((node, idx) => {
          if (idx > 0) {
            const from = element.nodes[idx - 1];
            const to = element.nodes[idx];
            if (graph.getNode(from) && graph.getNode(to)) {
              graph.addLink(from, to);
            }
          } 
        })
      }
    });

    return {graph, bounds: offset};
  }).then(({graph, bounds}) => {
    appState.setGraph(graph, bounds);
    appState.building = false;
    bus.fire('graph-loaded');
  });
}

function showRegionOptions(data) {
  appState.chooseFrom = [];

  data.elements.forEach(element => {
    var tags = element.tags;
    if (!tags) return;
    if (element.tags.boundary !== 'administrative') return;
    appState.chooseFrom.push({
      name: tags['name:en'] || tags.name,
      el: element,
    });
  });

  appState.currentState = appState.chooseFrom.length > 0 ? 'choose' : '';
}
