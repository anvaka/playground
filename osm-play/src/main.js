/* global mapboxgl */
import getAreasAround from './lib/getAreasAround';
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
  appState.currentState = 'loading';

  getAreasAround(e.lngLat, map.getBounds())
    .then(showRegionOptions) 
    .catch(error => console.error(error))
});

bus.on('highlight-bounds', (el) => {
  highlightLayer(el.bounds);
});

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

function highlightLayer(bounds) {
    var b = bounds;
    if (map.getLayer('highlight')) {
      map.removeLayer('highlight');
      map.removeSource('highlight');
    }
    map.addLayer({
      id: 'highlight',
      type: 'fill',
      source: {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [ b.minlon, b.minlat],
                  [ b.maxlon, b.minlat],
                  [ b.maxlon, b.maxlat],
                  [ b.minlon, b.maxlat],
                  [ b.minlon, b.minlat],
                ]
              ]
            }
          }
      },
      layout: {},
      paint: {
        'fill-color': '#088',
        'fill-opacity': 0.8
      }
    });
  }