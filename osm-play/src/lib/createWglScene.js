const wgl = require('w-gl');

export default function createWglScene(canvas, appState) {
  debugger;
  let scene;
  let lines = null;
  let graph = appState.getGraph();

  init();

  return {
    setBackgroundColor,
    setLinesColor,
    renderFrame,
    getWGLScene,
    dispose
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

    const {r, g, b, a} = newColor;
    const lineColor = lines.color;

    lineColor.r = r/255;
    lineColor.g = g/255;
    lineColor.b = b/255;
    lineColor.a = a;

    scene.renderFrame();
  }

  function setBackgroundColor(color) {
      scene.setClearColor(color.r/255, color.g/255, color.b/255, color.a);

      scene.renderFrame();
  }

  function init() {
    canvas.style.display = 'block';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    scene = wgl.scene(canvas);

    let bg = appState.backgroundColor;
    scene.setClearColor(bg.r/255, bg.g/255, bg.b/255, bg.a);

    // bug in w-gl
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    scene.setPixelRatio(1);
    scene.setViewBox(appState.getGraphBBox());

    let lineColor = appState.lineColor;
    makeLines(lineColor);
  }

  function makeLines(lineColor) {
    lines = new wgl.WireCollection(graph.getLinksCount());
    lines.color = {r: lineColor.r/255, g: lineColor.g/255, b: lineColor.b/255, a: lineColor.a};

    graph.forEachLink(function (link) {
      let from = graph.getNode(link.fromId).data;
      let to = graph.getNode(link.toId).data
      lines.add({ from, to });
    });
    scene.appendChild(lines);
  }
}