var map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json', // stylesheet location
  center: [0, 0],
  zoom: 5,
  maxZoom: 6.5,
  minZoom: 1
});

map.on('load', function() {
  // Where is the data?
  map.addSource('my-polygon', {
    'type': 'geojson',
    'data': 'polygon.geojson'
  });
  // How to style the data?
  map.addLayer({
    'id': 'my-layer',
    'type': 'fill',
    'source': 'my-polygon',
    'layout': {},
    'paint': {
      'fill-color': ["case",
          ["==", ["get", "className"], "s0"], "#a8afd4",
          ["==", ["get", "className"], "s1"], "#2d2e24",
          ["==", ["get", "className"], "s2"], "#b0b6da",
          ["==", ["get", "className"], "s3"], "#dfdad5",
          ["==", ["get", "className"], "s4"], "#9295b1",
          "#766964"
      ],
      'fill-opacity': 0.8
    }
  });
});


// map.addLayer({
//   "id": "background",
//   "type": "background",
//   "paint": {
//     "background-color": "rgb(189,189,215)"
//   }
// });
