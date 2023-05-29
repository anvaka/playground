const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json', // stylesheet location
  center: [0, 0],
  zoom: 2,
  maxZoom: 6.5,
  minZoom: 1
});

map.on('load', function() {
  map.addSource('my-polygon', { 'type': 'geojson', 'data': 'polygon.geojson' });
  map.addLayer(myLayer());
});

map.on('click', 'my-layer', function(e) {
  const videoContainer = document.createElement('div');
  videoContainer.innerHTML = '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  videoContainer.style.position = 'absolute';
  videoContainer.style.left = (e.point.x - 560/2)+ 'px';
  videoContainer.style.top =  (e.point.y - 315/2)+ 'px';
  document.body.appendChild(videoContainer);
});

function myLayer() {
  return {
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
  }
}


