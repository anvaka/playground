<template>
  <div class='app-container'>
    <div id='map' :style='getGuideLineStyle()'></div>
    <canvas class='absolute scene-roads' :style='getGuideLineStyle()'></canvas>
    <div id="app" class='absolute'> 
      <div v-if='currentState === "intro"' class='step padded'>
        <h3>You are designing <strong>a mug</strong></h3>
        <div>
          Align the map and click "Build" to get 
          all <select v-model='possibleScripts.selected' class='script-presets'>
            <option v-for='groupBy in possibleScripts.options' :value='groupBy.value'>{{groupBy.text}}</option>
	        </select> in the area.
        </div>
      </div>

      <div v-if='currentState === "canvas"' class='canvas-settings'>
        <div class='step'>
          <a href='#' @click.prevent='resetAllAndStartOver' v-if='!generatingPreview' class='start-over'>Start over</a>
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
          <div>
            <label class='browse-btn primary-text' for="local-files-button">Add KML file</label>
            <input type='file' id='local-files-button' class='nodisplay' name="files[]" @change='onFilePickerChanged'>
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
      <div class='download' v-if='!building && currentState === "intro"'>
        <a href="#" @click.prevent='downloadAllRoads()'>Build</a>
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
  </div>
</template>

<script>
import appState from './appState';
import bus from './bus';
import ColorPicker from './components/ColorPicker';
import Loading from './components/Loading';
import generateZazzleLink from './lib/getZazzleLink';
import createWglScene from './lib/createWglScene'

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
    this.init();
    //setMapSize();
    //window.addEventListener('resize', setMapSize); 
  },
  beforeDestroy() {
    bus.off('graph-loaded', this.createScene);
    this.ensurePreviousSceneDestroyed();
  },
  methods: {
    onFilePickerChanged(e) {
      console.log(e);
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
        return;
      }

      let canvas = getRoadsCanvas();
      appState.generatingPreview = true;

      this.scene.renderFrame();

      requestAnimationFrame(() => {
        generateZazzleLink(canvas).then(link => {
          appState.zazzleLink = link;
          appState.generatingPreview = false;
          window.open(link, '_blank');
        }).catch(e => {
          appState.error = e;
          appState.generatingPreview = false;
        });
      })
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
      this.scene = createWglScene(getRoadsCanvas(), appState);
      this.scene.getWGLScene().on('transform', () => { appState.zazzleLink = null; })
    },
  }
}

function setMapSize() {
  let map = document.getElementById('map');
  let d = getCanvasDimensions();
  map.style.left = px(d.left);
  map.style.top = px(d.top);
  map.style.width = px(d.width);
  map.style.height = px(d.height);
}

function px(x) {
  return x + 'px';
}

function getCanvasDimensions() {
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
</script>

<style lang='stylus'>
border-color = #d8d8d8;

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

.preview-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border-top: 1px solid border-color;
  margin-top: 12px;
  
  a.action {
    height: 32px;
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
</style>
