/**
 * This is the website startup point.
 */
import appState from "./appState";
import themes from './lib/themes';
import mapboxgl from "mapbox-gl";
import createHeightMapRenderer from "./lib/createHeightMapRenderer";
import { MAPBOX_TOKEN } from "./config";
import { getMarsStyle } from "./getMarsStyle";
import {createColorRampArray} from './lib/createColorRampCanvas';
import createState from 'query-state';

let themeNames = Object.keys(themes);
let themeIndex = 0;
let queryState = createState({
  theme: 'RED'
}, {
  useSearch: true
})

mergeStateFromQueryState();
augmentAppStateWithMethods();

// Load vue asyncronously
require.ensure("@/vueApp.js", () => {
  require("@/vueApp.js");
});

// Hold a reference to mapboxgl instance.
let map;

let heightMapRenderer, lastScheduledPrintMessage;


function mergeStateFromQueryState() {
  const themeName = queryState.get('theme');
  themeIndex = themeNames.findIndex(x => x === themeName);
  if (themeIndex < 0) themeIndex = 0;
  appState.theme = themeNames[themeIndex];
}

function augmentAppStateWithMethods() {
  // Let the vue know what to call to start the app.
  appState.init = init;
  appState.redraw = updateHeights;
  appState.setNextTheme = setNextTheme;
  appState.setThemeName = setThemeName;
  appState.setLabelsVisible = setLabelsVisible;
}

function init() {
  mapboxgl.accessToken = MAPBOX_TOKEN;

  window.map = map = new mapboxgl.Map({
    trackResize: true,
    container: "map",
    minZoom: 1,
    style: getMarsStyle(),
    center: [-92.880, 18.79],
    zoom: 2.64,
    hash: true
  });

  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

  map.on("zoomstart", hideHeights);
  map.on("zoomend", updateHeights);
  map.on("dragstart", hideHeights);
  map.on("dragend", updateHeights);
  map.on("load", function() {
    setLabelsVisible(appState.showLabels);
    schedulePrintMessage();
    // I was considering using native layers, to fetch the coordinates,
    // but my understanding of mapbox is not deep enough to do it yet.

    // map.showTileBoundaries = true;
    // map.addSource("dem", {
    //     type: "raster-dem",
    //     "url": "mapbox://anvaka.8ctdbgc9",
    //     "tileSize": 256,
    //     encoding: 'terrarium'
    // });
    // map.addLayer(
    //   {
    //     id: "hillshading",
    //     type: "hillshade",
    //     source: "dem",

    //   }
    // );
    // map.addLayer(
    //   {
    //     visibility: "none",
    //     id: "hillshading",
    //     type: "hillshade",
    //     source: "dem"
    //   },
    //   "water-shadow"
    // );

    updateHeights();
  });

  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();
}

function schedulePrintMessage() {
  if (lastScheduledPrintMessage) {
    clearTimeout(lastScheduledPrintMessage);
  }
  if (appState.showPrintMessage) return;

  lastScheduledPrintMessage = setTimeout(function() {
    appState.showPrintMessage = true;
  }, 10000)
}

function setNextTheme() {
  themeIndex += 1;
  themeIndex = themeIndex % themeNames.length;
  setThemeName(themeNames[themeIndex]);
}

function setThemeName(name) {
  themeIndex = themeNames.findIndex(x => x === name);
  if (themeIndex < 0) return;

  appState.theme = name;
  queryState.set('theme', appState.theme);
  if (map) {
    let layer = map.getLayer('mars200m')
    layer.colorRampTexture = null;
    map.setPaintProperty('mars200m', 'raster-color-ramp', createColorRampArray(appState.theme));
    updateCurrentLabelColors();


    map.triggerRepaint();
  }
}

function updateCurrentLabelColors() {
  schedulePrintMessage();
  let colors = getCurrentAppStateColors();
  getAllTextLayers().forEach(layerId => {
    map.setPaintProperty(layerId, 'text-color', colors.text);
    map.setPaintProperty(layerId, 'text-halo-color', colors.halo);
  });
}

function setLabelsVisible() {
  schedulePrintMessage();
  updateCurrentLabelColors();
}

function getCurrentAppStateColors() {
  if (appState.showLabels) {
    let theme = themes[appState.theme];
    return {
      text: theme.labelColor,
      halo: theme.haloColor
    }
  }
  return {
    text: 'transparent',
    halo: 'transparent'
  }
}

function getAllTextLayers() {
  return map.getStyle()
    .layers
    .filter(x => x.type === 'symbol' && x.source === 'composite')
    .map(x => x.id);

}

function hideHeights() {
  clearTimeout(lastScheduledPrintMessage);

  appState.zazzleLink = null;
  let canvas = document.querySelector(".height-map");
  if (canvas) canvas.style.opacity = 0.02;
}

function updateHeights() {
  schedulePrintMessage();
  if (!map) return;

  let heightMapCanvas = document.querySelector(".height-map");
  if (!heightMapCanvas) return;

  map.resize();
  if (!appState.shouldDraw) {
    heightMapCanvas.style.display = "none";
    return;
  } else {
    heightMapCanvas.style.display = "";
  }

  if (heightMapRenderer) {
    heightMapRenderer.cancel();
  }

  heightMapRenderer = createHeightMapRenderer(appState, map, heightMapCanvas);
  heightMapRenderer.render();
}
