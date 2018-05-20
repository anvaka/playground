/* global mapboxgl */
import * as osm from './lib/osm';
import appState from './appState';
import bus from './bus';

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

map.addControl(new mapboxgl.NavigationControl({
  showCompass: false
}));

var scrollingDiv = document.body;
scrollingDiv.addEventListener('touchmove', function(event){
    event.stopPropagation();
});

map.on('click', function(e) {
  removeHighlight();
  appState.currentState = 'loading';
  appState.selected = null;

  osm.getAreasAround(e.lngLat, map.getBounds())
    .then(showRegionOptions) 
    .catch(error => console.error(error))
});

bus.on('highlight-bounds', (el) => {
  highlightLayer(el.id);
});

bus.on('download-roads', (el) => {
  downloadRoads(el.id);
});

function downloadRoads(relId) {
  osm.getRoadsInRelationship(relId).then(d => console.log(d));
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

function removeHighlight() {
  if (map.getLayer('highlight')) {
    map.removeLayer('highlight');
    map.removeSource('highlight');
  }
}

function highlightLayer(relationId) {
    osm.getRelationBoundary(relationId)
      .then(buildPolygon)
      .then(drawPolygonHighlight);

    function drawPolygonHighlight(features) {
      map.addLayer({
        id: 'highlight',
        type: 'line',
        source: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: features
            }
        },
        layout: {},
        paint: {
          'line-width': 3,
          'line-color': '#A33F6F',
        }
      });
    }
  }

  function buildPolygon(osmBounds) {
    var {nodes, ways} = osmBounds;
    return ways.map(way => {

      let coordinates = way.nodes.map(node => {
        var n = nodes.get(node)
        return [n.lon, n.lat]
      });
      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      };
    });
  }