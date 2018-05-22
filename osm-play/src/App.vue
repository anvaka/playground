<template>
  <div id="app" class='absolute'>
    <div v-if='currentState === "loading"'>
      Loading...
    </div>
    <div v-if='currentState === "choose"'>
      <h4>Step 1: Select a boundary</h4>
      <ul>
        <li v-for="item in chooseFrom">
          <a href='#' @click.prevent='highlightBounds(item)'>{{item.name}}</a>
        </li>
      </ul>
    </div>
    <div v-if='selected'>
      <h4>Step 2: Download roads</h4>
      <a href="#" @click.prevent='downloadRoads(selected)'>Build roads for {{selected.name}}</a>
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
    this.webGLEnabled = wgl.isWebGLEnabled(document.querySelector('canvas'));
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

    ensurePreviousSceneDestroyed() {
      if (this.scene) {
        this.scene.dispose();
        this.scene = null;
      }
    },

    createScene() {
      this.ensurePreviousSceneDestroyed();
      let canvas = document.querySelector('canvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      this.graphLoaded = true;
      this.scene = wgl.scene(canvas);
      let scene = this.scene;

      let bbox = this.getGraphBBox();
      // let initialSceneSize = bbox.width/8;
      scene.setViewBox(bbox);
      // scene.setViewBox({
      //   left:  -initialSceneSize,
      //   top:   -initialSceneSize,
      //   right:  initialSceneSize,
      //   bottom: initialSceneSize,
      // })
      let graph = this.getGraph();
      let linksCount = graph.getLinksCount();
      let lines = new wgl.WireCollection(linksCount);
      lines.color = {r: 0.8, g: 0.8, b: 0.8, a: 0.7}
      // lines.color = {r: 0.1, g: 0.1, b: 0.1, a: 0.9}
      graph.forEachLink(function (link) {
        let from = graph.getNode(link.fromId).data;
        let to = graph.getNode(link.toId).data
        lines.add({ from, to });
      });
      scene.appendChild(lines);
    },
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  width: 400px;
  background: white;
}
</style>
