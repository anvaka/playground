/**
 * This is the website startup point.
 */
import * as osm from './lib/osm';
import appState from './appState';
import bus from './bus';
import constructGraph from './lib/constructGraph';
import formatNumber from './lib/formatNumber';
import mapboxgl from 'mapbox-gl';
import { getRegion, lat2tile, long2tile, tile2long } from './elevation';

var MapboxGeocoder = require('@mapbox/mapbox-gl-geocoder');

// Load vue asyncronously
require.ensure('@/vueApp.js', () => {
  require('@/vueApp.js');
});

// Hold a reference to mapboxgl instance.
let map;
// This will hold a reference to a function which cancels current download
var cancelDownload;

// Let the vue know what to call to start the app.
appState.init = init;

function init() {
  // TODO: Do I need to hide this?
  mapboxgl.accessToken = 'pk.eyJ1IjoiYW52YWthIiwiYSI6ImNqaWUzZmhqYzA1OXMza213YXh2ZzdnOWcifQ.t5yext53zn1c9Ixd7Y41Dw';
  map = new mapboxgl.Map({
      container: 'map',
      style: {
        "version": 8,
        "name": "Hillshade-only",
        "center": [-112.81596278901452, 37.251160384573595],
        "zoom": 11.560975632435424,
        "bearing": 0,
        "pitch": 0,
        "sources": {
            "mapbox://mapbox.terrain-rgb": {
                "url": "mapbox://mapbox.terrain-rgb",
                "type": "raster-dem",
                "tileSize": 256
            }
        },
        "layers": [
            {
                "id": "mapbox-terrain-rgb",
                "type": "hillshade",
                "source": "mapbox://mapbox.terrain-rgb",
                "layout": {},
                "paint": {}
            }
        ]
    },
      
      //'mapbox://styles/mapbox/streets-v9',
      center: [-122.2381,47.624],
      zoom: 11.32,
      hash: true
  });

  map.addControl(new mapboxgl.NavigationControl({showCompass: false}), 'bottom-right');
  map.addControl(new MapboxGeocoder({accessToken: mapboxgl.accessToken}));
  map.on('zoomend', updateHeights);
  map.on('dragend', updateHeights);
  map.on('load', updateHeights);

  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();

  bus.on('download-all-roads', updateHeights);
  bus.on('cancel-download-all-roads', () => {
    if (cancelDownload) cancelDownload();
  });
}

function updateHeights() {
  const bounds = map.getBounds();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast()
  const zoom = Math.floor(map.getZoom(zoom));
  const startTileLat = lat2tile(ne.lat, zoom);
  const startTileLng = long2tile(sw.lng, zoom);
  const endTileLng = long2tile(ne.lng, zoom);
  const endTileLat = lat2tile(sw.lat, zoom);

  let startXOffset = Math.round((startTileLng - Math.floor(startTileLng)) * 256);
  let startYOffset = Math.round((startTileLat - Math.floor(startTileLat)) * 256);
  let endXOffset = Math.round((Math.ceil(endTileLng) - endTileLng) * 256);
  let endYOffset = Math.round((Math.ceil(endTileLat) - endTileLat) * 256);

  getRegion(
    startTileLat, startTileLng,
    endTileLat, endTileLng,
    zoom,
    `https://api.mapbox.com/v4/mapbox.terrain-rgb/zoom/tLong/tLat.pngraw?access_token=${mapboxgl.accessToken}`
  ).then(region => {
    let now = performance.now();
    let resHeight = map.transform.height;
    let resWidth = map.transform.width;
    debugger;

    let result = document.createElement('canvas');
    result.classList.add('height-map')
    let ctx = result.getContext('2d');
    result.width = ctx.width = resWidth;
    result.height = ctx.height = resHeight;

    let rowCount = Math.round(resHeight/4);
    let columnCount = Math.round(resWidth/4);
    let scale = 84;
    const regionIterator = createRegionIterator(region, 
      startXOffset, startYOffset,
      region.width - endXOffset, region.height - endYOffset
    );
    let {minH, maxH} = regionIterator.getMinMaxHeight();
    
    let dh = maxH - minH;
    regionIterator.forEachRowColumn(rowCount, columnCount, function(row, col, height) {
        let heightRatio = (height - minH)/dh;
        let fX = resWidth * col;
        let fY = resHeight * row - scale * heightRatio;

        if(fY > resHeight) return;
        if (col === 0 || heightRatio < 0.0) {
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(fX, fY)
        } else {
          ctx.lineTo(fX, fY)
        }
    });
    ctx.stroke();

    let elapsed = performance.now() - now;
    console.log('Elapsed: ', elapsed/1000);
  //  document.body.appendChild(region);
    if (document.querySelector('.height-map')) {
      document.body.replaceChild(result, document.querySelector('.height-map'))
    } else {
      document.body.appendChild(result);
    }
  });

}

function createRegionIterator(region, left, top, right, bottom) {
  let data = region.getContext('2d').getImageData(0, 0, region.width, region.height).data;

  return {
    getMinMaxHeight,
    forEachRowColumn
  }

  function getMinMaxHeight() {
    let minH = Number.POSITIVE_INFINITY;
    let maxH = Number.NEGATIVE_INFINITY;
    for (let x = left; x < right; ++x) {
      for (let y = top; y < bottom; ++y) {
        let index = (y * region.width + x) * 4;
        let R = data[index + 0];
        let G = data[index + 1];
        let B = data[index + 2];
        let height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
        if (height < minH) minH = height;
        if (height > maxH) maxH = height;
      }
    }

    return {minH, maxH};
  }

  function forEachRowColumn(maxRows, maxColumns, heightCallback) {
    let dRows = 1/maxRows;
    let dColumns = 1/maxColumns;
    for (let row = 0; row < 1; row += dRows) {
      for (let col = 0; col < 1; col += dColumns) {
        let x = Math.round(left + col * (right - left));
        let y = Math.round(top + row * (bottom - top));

        let index = (y * region.width + x) * 4;
        let R = data[index + 0];
        let G = data[index + 1];
        let B = data[index + 2];
        let height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
        heightCallback(row, col, height);
      }
    }
  }
}