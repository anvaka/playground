/* global mapboxgl */

var map = new mapboxgl.Map({
    container: 'map',
    style: './static/style.json',
    center: [8.538961,47.372476],
    zoom: 5,
    hash: true
});

var scrollingDiv = document.getElementById('map');
scrollingDiv.addEventListener('touchmove', function(event){
    event.stopPropagation();
});