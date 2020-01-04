import { createColorRampArray } from "./lib/createColorRampCanvas";
import appState from "./appState";

export function getMarsStyle() {
  return {
    version: 8,
    name: "mars",
    center: [0, 0],
    zoom: 2.64,
    bearing: 0,
    pitch: 0,
    sources: getMarsSources(),
    sprite:
      "mapbox://sprites/anvaka/ck49e9ayb0djv1cmmjkpm8u16/ck2u8j60r58fu0sgyxrigm3cu",
    glyphs: "mapbox://fonts/anvaka/{fontstack}/{range}.pbf",
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": "hsla(0, 0%, 0%, 0)" }
      },
      {
        id: "mars200m",
        type: "raster",
        source: "mars-tiles",
        layout: {},
        paint: {
          "raster-color-ramp": createColorRampArray(appState.theme)
        }
      },
      {
        "id": "crater-label",
        "type": "symbol",
        "source": "composite",
        "source-layer": "mars_labels-bizwyb",
        "filter": [
            "match",
            ["get", "type"],
            ["Crater, craters"],
            true,
            false
        ],
        "layout": {
            "text-field": ["to-string", ["get", "clean_name"]],
            "text-size": [
                "interpolate",
                ["linear"],
                ["zoom"],
                3,
                12,
                12,
                ["case", [">", ["get", "diameter"], 50], 32, 26]
            ],
            "visibility": "none"
        },
        "paint": {}
    },
    {
        "id": "mountains",
        "type": "symbol",
        "source": "composite",
        "source-layer": "mars_labels-bizwyb",
        "filter": ["match", ["get", "type"], ["Mons, montes"], true, false],
        "layout": {
            "text-field": ["to-string", ["get", "clean_name"]],
            "text-size": [
                "step",
                ["zoom"],
                0,
                2,
                [
                    "max",
                    [
                        "+",
                        [
                            "/",
                            ["*", 16, ["-", ["get", "diameter"], 14]],
                            2044
                        ],
                        4
                    ],
                    14
                ],
                2.5,
                14
            ],
            "text-offset": [0, -1],
            "text-font": ["Roboto Regular", "Arial Unicode MS Regular"]
        },
        "paint": {
            "text-halo-width": 0.1,
            "text-halo-color": "hsla(0, 0%, 100%, 0.65)"
        }
    },
    {
        "id": "terra-labels",
        "type": "symbol",
        "source": "composite",
        "source-layer": "mars_labels-bizwyb",
        "filter": [
            "match",
            ["get", "type"],
            ["Terra, terrae"],
            true,
            false
        ],
        "layout": {
            "text-field": ["to-string", ["get", "clean_name"]],
            "text-size": ["step", ["zoom"], 14, 1, 14, 2, 0],
            "text-offset": [0, 0],
            "text-font": ["Roboto Medium", "Arial Unicode MS Regular"]
        },
        "paint": {
            "text-halo-color": "hsla(189, 0%, 100%, 0.71)",
            "text-color": "hsl(0, 0%, 0%)",
            "text-halo-width": 0.2
        }
    },
    {
        "id": "platia-labels",
        "type": "symbol",
        "source": "composite",
        "source-layer": "mars_labels-bizwyb",
        "filter": [
            "match",
            ["get", "type"],
            ["Planitia, planitiae"],
            true,
            false
        ],
        "layout": {
            "text-field": ["to-string", ["get", "clean_name"]],
            "text-size": ["step", ["zoom"], 14, 1, 14, 2, 0],
            "text-offset": [0, 0],
            "text-font": ["Roboto Medium", "Arial Unicode MS Regular"]
        },
        "paint": {
            "text-halo-color": "hsla(189, 0%, 100%, 0.71)",
            "text-color": "hsl(0, 0%, 0%)",
            "text-halo-width": 0.2
        }
    }
    ],
    created: "2019-12-17T04:55:56.118Z",
    id: "ck49e9ayb0djv1cmmjkpm8u16",
    modified: "2019-12-21T19:43:42.202Z",
    owner: "anvaka",
    visibility: "private",
    draft: false
  };
}

function getMarsSources() {
  return {
    "mars-tiles": {
        "url": "mapbox://anvaka.8ctdbgc9",
        "type": "raster",
        "tileSize": 256
    },
    "composite": {"url": "mapbox://anvaka.40t5yrsw", "type": "vector"}
  };
}
