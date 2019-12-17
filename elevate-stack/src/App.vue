<template>
  <div class='app-container'>
    <div id='map' ref='map'></div>
    <canvas class='absolute scene-roads' ref='roadsCanvas'></canvas>
    <canvas class='absolute ctx2d' ref='canvasLayer'></canvas>
    <div id="app" class='absolute'> 
      <div v-if='currentState === "intro"' class='step padded title'>
      </div>

      <div v-if='currentState === "canvas"' class='canvas-settings'>
        <div class='step'>
          <a href='#' @click.prevent='resetAllAndStartOver' v-if='!generatingPreview' class='start-over'>Start over</a>
          <h3 class='left-right-padded'>Tune Color</h3>
          <div class='row left-right-padded'>
            <div class='col'>
              Background
              <color-picker v-model='backgroundColor' @change='updateBackground'></color-picker>
            </div>
            <div class='col'>
              Foreground
              <color-picker v-model='lineColor' @change='updateLinesColor'></color-picker>
            </div>
          </div>
        </div>
        
      </div>
      <div class='form' v-if='!building && currentState === "intro"'>
        <div class='row'>
          <div class='col'>Line density</div>
          <div class='col'>
            <input type="range" min="1" max="100" step="1" v-model="lineDensity"> 
            <input type='number' :step='1' v-model='lineDensity'  autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" min='1' max='100'>
          </div>
        </div>
        <div class='row'>
          <div class='col'>Height scale</div>
          <div class='col'>
            <input type="range" min="10" max="800" step="1" v-model="heightScale"> 
            <input type='number' :step='1' v-model='heightScale'  autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" min='10' max='800'>
          </div>
        </div>
        <div class='row'>
          <div class='col'>Ocean level</div>
          <div class='col'><input type='number' :step='1' v-model='oceanLevel' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" ></div>
        </div>
        <div class='row'>
          <div class='col'>Smooth steps</div>
          <div class='col'>
            <input type="range" min="1" max="50" step="1" v-model="smoothSteps"> 
            <input type='number' :step='1' v-model='smoothSteps'  autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" min='1' max='100'>
          </div>
        </div>
        <div class='row'>
          <div class='col'>Overlay opacity</div>
          <div class='col'>
            <input type="range" min="1" max="100" step="1" v-model="mapOpacity"> 
            <input type='number' :step='1' v-model='mapOpacity'  autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" min='1' max='100'>
          </div>
        </div>
        <div class='preview-actions'>
          <a href='#' @click.prevent='previewOrOpen' v-if='!generatingPreview && !zazzleLink' class='action' :class='{"has-link": zazzleLink}'>
            Preview mug
          </a>
          <div v-if='zazzleLink' class='padded popup-help'>
            If your browser has blocked the new window, please <a :href='zazzleLink' target='_blank'>click here</a>
            to open it.
          </div>
          <div v-if='generatingPreview' class='loading-container'>
            <loading></loading> Generating preview url...
          </div>
        </div>
      </div>
      <div v-if='blank' class='no-roads padded'>
        Hm... There is nothing here. Try a different area?
      </div>
      <div class='loading padded' v-if='building'>
        <div class='loading-container'><loading></loading> {{buildingMessage}}</div>
        <a href="#" @click.prevent='cancelDownload()' v-if='showCancelDownload' class='align-center cancel-button'>Cancel</a>
      </div>
      <div class='error padded' v-if='error'>
        <h5>Error occurred:</h5>
        <pre>{{error}}</pre>
      </div>

    </div>

    <div class='intro-help' v-if='currentState === "intro"' >
    </div>
    <div class='about-line'>
    </div>

    <about v-if='aboutVisible' @close='aboutVisible = false'></about>

  </div>
</template>

<script>
import appState from './appState';
import bus from './bus';
import ColorPicker from './components/ColorPicker';
import Loading from './components/Loading';
import About from './components/About';
import generateZazzleLink from './lib/getZazzleLink';
import createWglScene from './lib/createWglScene';
import parseKMLFile from './lib/parseKMLFile.js';

const wgl = require('w-gl');

export default {
  name: 'App',
  data() {
    return appState;
  },
  components: {
    Loading,
    About,
    ColorPicker
  },
  mounted() {
    this.webGLEnabled = wgl.isWebGLEnabled(getRoadsCanvas());
    bus.on('graph-loaded', this.createScene, this);
    updateSizes(this.$refs);
    this.init();
    this.onResize = () => updateSizes(this.$refs);
    window.addEventListener('resize', this.onResize, true);
  },
  beforeDestroy() {
    bus.off('graph-loaded', this.createScene);
    this.ensurePreviousSceneDestroyed();
    window.removeEventListener('resize', this.onResize, true);
  },
  watch: {
    lineDensity(newValue, oldValue) {
      this.redraw();
    },
    oceanLevel(newValue, oldValue) {
      this.redraw();
    },
    heightScale() {
      this.redraw();
    },
    smoothSteps() {
      this.redraw();
    },
    mapOpacity(newValue) {
      let heightMap = document.querySelector('.height-map')
      if (heightMap) {
        heightMap.style.opacity = parseFloat(newValue) / 100;
      }
    }
  },
  methods: {
    updateLayerColor(layer) {
      layer.updateColor();
      this.scene.renderFrame();
    },

    getGuideLineStyle() {
      let d = getCanvasDimensions();
      return {
        top: px(d.top),
        left: px(d.left),
        width: px(d.width),
        height: px(d.height)
      };
    },

    updateBackground(x) {
      this.scene.setBackgroundColor(appState.backgroundColor);
    },

    updateLinesColor(x) {
      this.scene.setLinesColor(appState.lineColor);
    },

    downloadAllRoads() {
      bus.fire('download-all-roads');
    },

    cancelDownload() {
      bus.fire('cancel-download-all-roads');
    },

    previewOrOpen() {
      if (this.zazzleLink) {
        window.open(this.zazzleLink, '_blank');
        recordOpenClick(this.zazzleLink);
        return;
      }

      let canvas = document.querySelector('.height-map')
      if (!canvas) {
        return;
      }
      appState.generatingPreview = true;

      generateZazzleLink(canvas).then(link => {
        appState.zazzleLink = link;
        window.open(link, '_blank');
        recordOpenClick(link);
        appState.generatingPreview = false;
      }).catch(e => {
        appState.error = e;
        appState.generatingPreview = false;
      });
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
      appState.startOver();
    },

    createScene() {
      this.ensurePreviousSceneDestroyed();

      this.graphLoaded = true;

      const roadsCanvas = getRoadsCanvas();    
      roadsCanvas.style.display = 'block';
      this.scene = createWglScene(roadsCanvas, get2dCanvas(), appState);
    },
  }
}
function updateSizes(refs) {
  let dimensions = getCanvasDimensions();
  setGuideLineSize(refs.map, dimensions);
  setGuideLineSize(refs.roadsCanvas, dimensions);
  setGuideLineSize(refs.canvasLayer, dimensions);
}

function setGuideLineSize(el, dimensions) {
  el.style.left = px(dimensions.left);
  el.style.top = px(dimensions.top);
  el.style.width = px(dimensions.width);
  el.style.height = px(dimensions.height);
}

function px(x) {
  return x + 'px';
}

function getCanvasDimensions() {

  // return {
  //   width: 512,
  //   height: 512,
  //   left: 128,
  //   top: 128
  // };
  let {innerWidth: w, innerHeight: h} = window;
  let desiredRatio = 540/230; // mug ratio on zazzle. TODO: Customize for other products.
  let guidelineHeight = w / desiredRatio;

  let guideLineWidth = w;
  let left = 0;

  if (guidelineHeight > h) {
    guidelineHeight = h;
    guideLineWidth = guidelineHeight * desiredRatio;
    left = (w - guideLineWidth) / 2;
  }

  let top = (h - guidelineHeight)/2;

  return {
    width: guideLineWidth,
    height: guidelineHeight,
    left: left,
    top: top
  };
}
function getRoadsCanvas() {
  return document.querySelector('.scene-roads');
}

function get2dCanvas() {
  return document.querySelector('.ctx2d');
}

function recordOpenClick(link) {
  if (typeof ga === 'undefined') return;

  ga('send', 'event', {
      eventCategory: 'Outbound Link',
      eventAction: 'click',
      eventLabel: link
    });
}
</script>

<style lang='stylus'>
border-color = #d8d8d8;
primary-action-color = #ff4081;
small-screen = 500px;

.app-container {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

#app {
  width: 400px;
  background: white;
  z-index: 4;
  box-shadow: 0 0 20px rgba(0,0,0,.3);
}
h3 {
  margin: 12px 0;
}
.height-map {
  position: absolute;
  pointer-events: none;
  // background: white;
  left: 0px;
  top: 68px;
  z-index: 3;
  width: 1440px;
  height: 614px;
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

.file-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.preview-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border-top: 1px solid border-color;
  margin-top: 12px;
  min-height: 32px;
  
  a.action {
    flex: 1;
    align-items: center;
    display: flex;
    justify-content: center;
    border-bottom: 1px solid border-color;
  }
  a.action.has-link {
    border-bottom: none;
  }

  .preview-btn {
    border-left: 1px solid border-color;
  }
  .popup-help {
    border-bottom: 1px solid border-color;
    text-align: center;
  }
}
.cancel-button {
    width: 100%;
    display: block;
    margin-top: 8px;
}
.align-center {
  text-align: center;
}
.left-right-padded {
  padding-left: 12px;
  padding-right: 12px;
}
.start-over {
  position: absolute;
  right: 8px;
  top: 8px;
  display: block;
  font-size: 12px;
}
.scene-roads {
  display: none;
  z-index: 3;
}

.padded {
  padding: 12px;
}
.no-roads {
  color: orangered;
}

.block {
  margin-top: 12px;
  padding-top: 10px;
  display: flex;
  flex-direction: column;
}
a {
  color: primary-action-color;
  text-decoration: none;
}
.canvas-settings {
  padding-bottom: 12px;
}
.error pre {
  overflow-x: auto;
}
.guidelines {
  position: absolute;
  border: 2px solid gray;
  pointer-events: none;

  .label {
    text-align: center;
    padding: 2px 10px;
    background: rgba(255, 255, 255, 0.3);
    position: absolute;
    bottom: 0;
  }
}
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
  svg {
    margin-right: 12px;
  }
}
.script-presets {
  display: inline-block;
}
.ctx2d {
  z-index: 3;
  pointer-events: none;
}
.nodisplay {
  display: none;
}
.browse-btn {
  color: primary-action-color;
  cursor: pointer;
}
.zoom-warning {
  position: fixed;
  z-index: 10;
  bottom: 10px;
  padding: 7px;
  right: 0;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  h4 {
    margin: 7px 0;
  }
}
.intro-help {
  position: absolute;
  top: 12px;
  left: 50%;
}
.about-line {
  display: flex;
  flex-direction: column;
  position: fixed;

  top: 12px;
  right: 10px;
  font-size: 14px;
}
.osm-note {
  position: fixed;
  padding: 12px;

  bottom: 0;
  right: 0;
  font-size: 12px;
}
.title {
  font-size: 18px;
}
.row {
  display: flex;
  flex-direction: row;
}
.center {
  justify-content: center;
}
.col {
  flex: 1;
}

@media (max-width: small-screen) {
  #app {
    width: 100%;
  }
  .mapboxgl-ctrl-geocoder {
    display: none;
  }

  .title {
    font-size: 16px;
  }
  .about-line {
    display: flex;
    flex-direction: row;
    bottom: 50px;
    top: inherit;
    left: 0;
    right: 0;
    justify-content: space-between;
    padding: 12px;
  }
}
</style>
