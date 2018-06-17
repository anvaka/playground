<template>
  <div id="app" class='absolute'>
    <div v-if='currentState === "intro"' class='step padded'>
      Align the map and click "Build" to build 
      all roads in printable format.
    </div>

    <div v-if='currentState === "canvas"' class='canvas-settings'>
      <div class='padded step'>
        Now you can right click on a canvas and save it. Or
        <a href='#' @click.prevent='resetAllAndStartOver'>choose a different area</a>.
      </div>
      <div class='step'>
        <h3 class='left-right-padded'>Customize</h3>
        <div class='row left-right-padded'>
          <div class='col'>Background</div>
          <div class='col'>
            <color-picker v-model='backgroundColor' @change='updateBackground'></color-picker>
          </div>
        </div>
        <div class='row left-right-padded'>
          <div class='col'>Foreground</div>
          <div class='col'>
            <color-picker v-model='lineColor' @change='updateLinesColor'></color-picker>
          </div>
        </div>
      </div>
      <div class='left-right-padded preview-actions'>
        <a href="#" @click.prevent='upload' v-if='!generatingPreview'>Generate preview url</a>
        <a v-if='zazzleLink' :href='zazzleLink' target='_blank'>Preview Mug</a>
      </div>
      <loading v-if='generatingPreview'></loading>
    </div>
    <div class='download' v-if='!building && currentState === "intro"'>
      <a href="#" @click.prevent='downloadAllRoads()'>Build</a>
    </div>
    <div v-if='blank' class='no-roads padded'>
      Hm... There is nothing here. Try a different area?
    </div>
    <div class='loading padded' v-if='building'>
      <loading></loading>
      <div>{{buildingMessage}}</div>
    </div>
    <div class='error padded' v-if='error'>
      <h5>Error occured:</h5>
      <pre>{{error}}</pre>
    </div>
  </div>
</template>

<script>
import appState from './appState';
import bus from './bus';
import ColorPicker from './components/ColorPicker';
import Loading from './components/Loading';

const wgl = require('w-gl');

export default {
  name: 'App',
  data() {
    return appState;
  },
  components: {
    Loading,
    ColorPicker
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
    updateBackground(x) {
      if (!this.scene) return;

      const bg = appState.backgroundColor;
      this.scene.setClearColor(bg.r/255, bg.g/255, bg.b/255, bg.a);
      this.scene.renderFrame();
    },
    updateLinesColor(x) {
      if (!this.lines) return;

      const {r, g, b, a} = appState.lineColor;
      const lineColor = this.lines.color;
      lineColor.r = r/255;
      lineColor.g = g/255;
      lineColor.b = b/255;
      lineColor.a = a;
      this.scene.renderFrame();
    },
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
    upload() {
      bus.fire('upload', getRoadsCanvas());
    },
    ensurePreviousSceneDestroyed() {
      if (this.scene) {
        this.scene.dispose();
        this.scene = null;
        this.lines = null;
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
      let graph = this.getGraph();
      let canvas = getRoadsCanvas();
      canvas.style.display = 'block';
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      this.graphLoaded = true;
      this.scene = wgl.scene(canvas);
      let scene = this.scene;

      let bg = appState.backgroundColor;
      scene.setClearColor(bg.r/255, bg.g/255, bg.b/255, bg.a);
      // bug in w-gl
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      scene.setPixelRatio(1);

      let bbox = this.getGraphBBox();
      scene.setViewBox(bbox);
      let linksCount = graph.getLinksCount();
      let lines = new wgl.WireCollection(linksCount);
      this.lines = lines;
      let lc = appState.lineColor;
      lines.color = {r: lc.r/255, g: lc.g/255, b: lc.b/255, a: lc.a}

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

<style lang='stylus'>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  width: 400px;
  background: white;
  padding: 12px 0 0 0;
  z-index: 4;
  box-shadow: 0 0 20px rgba(0,0,0,.3);
}
.col {
    align-items: center;
    display: flex;
    flex: 1;
    select {
      margin-left: 14px;
    }
  }
  .row {
    margin-top: 4px;
    display: flex;
    flex-direction: row;
    height: 32px;
  }
.step {
  border-bottom: 1px solid #d8d8d8;
}
.preview-actions {
  display: flex;
  flex-direction: row;
  height: 32px;
  align-items: stretch;
  
  a {
    flex: 1;
    align-items: center;
    display: flex;
    justify-content: center;
  }
}
.left-right-padded {
  padding-left: 12px;
  padding-right: 12px;
}
.start-over {
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid #d8d8d8;
}
.scene-roads {
  z-index: 3;
}

.padded {
  padding: 12px;
}
.no-roads {
  color: orangered;
}

.download {
  display: flex;
  align-items: stretch;
  height: 42px;

  a {
    text-align: center;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
a {
  color: #ff4081;
  text-decoration: none;
}
.canvas-settings {
  padding-bottom: 12px;
}
.error pre {
  overflow-x: auto;
}
</style>
