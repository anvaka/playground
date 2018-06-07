<template>
  <div id="app" class='absolute'>
    <div v-if='currentState === "intro"' class='step padded'>
      Align the map and click "Build" to build 
      all roads in printable format.
    </div>
    <div v-if='currentState === "canvas"'>
      <div class='padded canvas-step'>
        Now you can right click on a canvas and save it. Or
        <a href='#' @click.prevent='resetAllAndStartOver'>choose a different area</a>.
      </div>
      <div class='row padded'>
        <div class='col'>Background</div>
        <div class='col'>
          <color-picker v-model='backgroundColor' @change='updateBackground'></color-picker>
        </div>
      </div>
      <div class='row padded'>
        <div class='col'>Foreground</div>
        <div class='col'>
          <color-picker v-model='lineColor' @change='updateLinesColor'></color-picker>
        </div>
      </div>
    </div>
    <div class='download' v-if='!building && currentState === "intro"'>
      <a href="#" @click.prevent='downloadAllRoads()'>Build</a>
    </div>
    <div v-if='blank' class='no-roads padded'>
      Hm... There is nothing here. Try a different area?
    </div>
    <div class='loading padded' v-if='building'>
      <div class='loader'></div>
      <div>{{buildingMessage}}</div>
      <div v-if='memoryInfo'>
        {{memoryInfo}}
      </div>
    </div>
  </div>
</template>

<script>
import appState from './appState';
import bus from './bus';
// import {Sketch} from 'vue-color';
// import { VueColorpicker } from 'vue-pop-colorpicker'
import ColorPicker from './components/ColorPicker';

const wgl = require('w-gl');

export default {
  name: 'App',
  data() {
    return appState;
  },
  components: {
    //'color-picker': Sketch,
     'color-picker': ColorPicker
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
  padding: 12px 0;
  z-index: 4;
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
.canvas-step {
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

  a {
    flex: 1;
    text-align: center;
    padding-top: 7px;
  }
}

.loader,
.loader:before,
.loader:after {
  border-radius: 50%;
  width: 2.5em;
  height: 2.5em;
  -webkit-animation-fill-mode: both;
  animation-fill-mode: both;
  -webkit-animation: load7 1.8s infinite ease-in-out;
  animation: load7 1.8s infinite ease-in-out;
}
.loader {
  color: #404041;
  font-size: 10px;
  margin: 80px auto;
  position: relative;
  text-indent: -9999em;
  -webkit-transform: translateZ(0);
  -ms-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-animation-delay: -0.16s;
  animation-delay: -0.16s;
}
.loader:before,
.loader:after {
  content: '';
  position: absolute;
  top: 0;
}
.loader:before {
  left: -3.5em;
  -webkit-animation-delay: -0.32s;
  animation-delay: -0.32s;
}
.loader:after {
  left: 3.5em;
}
@-webkit-keyframes load7 {
  0%,
  80%,
  100% {
    box-shadow: 0 2.5em 0 -1.3em;
  }
  40% {
    box-shadow: 0 2.5em 0 0;
  }
}
@keyframes load7 {
  0%,
  80%,
  100% {
    box-shadow: 0 2.5em 0 -1.3em;
  }
  40% {
    box-shadow: 0 2.5em 0 0;
  }
}

</style>
