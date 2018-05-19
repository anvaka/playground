/* global mapboxgl */
var appState = {
  chooseFrom: []
}

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
  getAreasAround(e.lngLat);
});

function getAreasAround(lonLat) {
  var bounds = map.getBounds();
  var sw = bounds.getSouthWest();
  var ne = bounds.getNorthEast()
  postData('https://overpass-api.de/api/interpreter', 
  `[timeout:10][out:json];
is_in(${lonLat.lat}, ${lonLat.lng})->.a;
way(pivot.a);
out tags bb;
out ids geom(${sw.lat},${sw.lng},${ne.lat},${ne.lng});
relation(pivot.a);
out tags bb;`
)
    .then(renderBounds) // JSON from `response.json()` call
    .catch(error => console.error(error))
}

function renderBounds(data) {
  appState.chooseFrom = [];

  data.elements.forEach(element => {
    if (!element.tags) return;
    if (element.tags.boundary !== 'administrative') return;
    appState.chooseFrom.push(element);

    //highlightLayer(element.bounds)
  })
}

function highlightLayer(bounds) {
    var b = bounds;
    map.removeLayer('highlight');
    map.addLayer({
        'id': 'highlight',
        'type': 'fill',
        'source': {
            'type': 'geojson',
            'data': {
                'type': 'Feature',
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [
                      [
                        [ b.minlon, b.minlat],
                        [ b.maxlon, b.minlat],
                        [ b.maxlon, b.maxlat],
                        [ b.minlon, b.maxlat],
                        [ b.minlon, b.minlat],
                      ]]
                }
            }
        },
        'layout': {},
        'paint': {
            'fill-color': '#088',
            'fill-opacity': 0.8
        }
    });
  }

function postData(url, data) {
  // Default options are marked with *
  return fetch(url, {
    body: 'data=' + encodeURIComponent(data),
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, cors, *same-origin
    redirect: 'follow', // manual, *follow, error
    referrer: 'no-referrer', // *client, no-referrer
  })
  .then(response => response.json()) // parses response to JSON
}
// [timeout:10][out:json];is_in(47.6188,-122.1820)->.a;way(pivot.a);out tags bb;out ids geom(47.59173471461263,-122.21560209989548,47.63223851563446,-122.17097014188766);relation(pivot.a);out tags bb;