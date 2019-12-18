// import TextCanvasElement from './scene-parts/text';
import CanvasLayer from "./scene-parts/canvas-layer";
import KMLLayer from "./scene-parts/kml-layer";
import MergeCanvasLayer from "./scene-parts/merge-canvas-layer";

const wgl = require("w-gl");
const DEBUG_LINES = false;

export default function createWglScene(canvas, canvas2d, appState) {
  let scene;
  let lines = null;
  let canvasLayer, mergeLayer;
  let graph = appState.getGraph();

  init();

  return {
    setBackgroundColor,
    setLinesColor,
    renderFrame,
    getWGLScene,
    dispose,
  };

  function dispose() {
    scene.dispose();

    lines = null;
    scene = null;
  }

  function getWGLScene() {
    return scene;
  }

  function renderFrame() {
    if (scene) return scene.renderFrame();
  }

  function setLinesColor(newColor) {
    if (!lines) return;

    resetLink();
    const { r, g, b, a } = newColor;
    const lineColor = lines.color;

    lineColor.r = r / 255;
    lineColor.g = g / 255;
    lineColor.b = b / 255;
    lineColor.a = a;

    scene.renderFrame();
  }

  function setBackgroundColor(color) {
    resetLink();

    scene.setClearColor(color.r / 255, color.g / 255, color.b / 255, color.a);
    scene.renderFrame();
  }

  function init() {
    scene = wgl.scene(canvas, {
      size: {
        width: 1440,
        height: 613
      }
    });

    let bg = appState.backgroundColor;
    scene.setClearColor(bg.r / 255, bg.g / 255, bg.b / 255, bg.a);

    canvas2d.width = canvas.width;
    canvas2d.height = canvas.height;

    scene.setPixelRatio(1);
    scene.setViewBox(appState.getGraphBBox());

    let lineColor = appState.lineColor;
    makeLines(lineColor);

    let ctx2d = canvas2d.getContext("2d");
    canvasLayer = new CanvasLayer(ctx2d);

    scene.appendChild(canvasLayer);
    scene.on("transform", resetLink);
  }

  function resetLink() {
    appState.zazzleLink = null;
  }

  function makeLines(lineColor) {
    lines = new wgl.WireCollection(graph.getLinksCount());
    lines.color = {
      r: lineColor.r / 255,
      g: lineColor.g / 255,
      b: lineColor.b / 255,
      a: lineColor.a
    };

    graph.forEachLink(function(link) {
      let from = graph.getNode(link.fromId).data;
      let to = graph.getNode(link.toId).data;
      lines.add({ from, to });
    });
    scene.appendChild(lines);

    // Use these to debug
    if (DEBUG_LINES) {
      // Couple lines with distinct colors to debug placement of canvas layer.
      let guideline = new wgl.WireCollection(1);
      guideline.color = { r: 1, g: 0, b: 0, a: 1 };
      guideline.add({ from: { x: 0, y: 0 }, to: { x: 100, y: 0 } });
      scene.appendChild(guideline);

      guideline = new wgl.WireCollection(1);
      guideline.color = { r: 0, g: 1, b: 0, a: 1 };
      guideline.add({ from: { x: 0, y: -100 }, to: { x: 100, y: -100 } });
      scene.appendChild(guideline);
    }
  }
}
