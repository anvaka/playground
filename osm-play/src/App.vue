<template>
  <div id="app" class='absolute'>
    <div v-if='currentState === "intro"' class='step'>
      Align the map and click "Download" to download 
      all roads in printable format.
    </div>
    <div class='download'>
      <a href="#" @click.prevent='downloadAllRoads()'>Download</a>
    </div>

    <div v-if='currentState !== "intro"' class='start-over'>
      <a href='#' @click.prevent='resetAllAndStartOver'>Start over</a>
    </div>

  </div>
</template>

<script>
import appState from './appState';
import bus from './bus';

const wgl = require('w-gl');

export default {
  name: 'App',
  data() {
    return appState;
  },
  components: {
  },
  mounted() {
    this.webGLEnabled = wgl.isWebGLEnabled(getRoadsCanvas());
    bus.on('graph-loaded', this.createScene, this);
  },
  beforeDestroy() {
    bus.off('graph-loaded', this.createScene);
    this.ensurePreviousSceneDestroyed();
  },
  methods: {
    highlightBounds(item) {
      appState.selected = item;
      bus.fire('highlight-bounds', item.el);
    },
    downloadRoads(item) {
      bus.fire('download-roads', item.el);
    },
    downloadAllRoads() {
      bus.fire('download-all-roads');
    },
    ensurePreviousSceneDestroyed() {
      if (this.scene) {
        this.scene.dispose();
        this.scene = null;
      }
      var canvas = getRoadsCanvas();
      canvas.style.display = 'none';
    },
    resetAllAndStartOver() {
      this.ensurePreviousSceneDestroyed();
      bus.fire('start-over');
    },
    createScene() {
      this.ensurePreviousSceneDestroyed();
      let canvas = getRoadsCanvas();
      canvas.style.display = 'block';
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      this.graphLoaded = true;
      this.scene = wgl.scene(canvas);
      let scene = this.scene;
      scene.setClearColor(1, 1, 1, 1);
      // bug in w-gl
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      scene.setPixelRatio(1);

      let bbox = this.getGraphBBox();
      scene.setViewBox(bbox);
      let graph = this.getGraph();
      let linksCount = graph.getLinksCount();
      let lines = new wgl.WireCollection(linksCount);
      lines.color = {r: 0, g: 0, b: 0, a: 0.8}
      graph.forEachLink(function (link) {
        let from = graph.getNode(link.fromId).data;
        let to = graph.getNode(link.toId).data
        lines.add({ from, to });
      });
      scene.appendChild(lines);
    },
  }
}

function getRoadsCanvas() {
  return document.querySelector('.scene-roads');
}
</script>

<style lang='styl'>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  width: 400px;
  background: white;
  padding: 12px 0;
  z-index: 4;
}
.step {
  padding: 12px;
  border-bottom: 1px solid gray;
}
.start-over {
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid gray;
}
.scene-roads {
  z-index: 3;
}
.download {
  display: flex;
  align-items: stretch;

  a {
    flex: 1;
    text-align: center;
    padding-top: 7px;
  }
}
</style>
