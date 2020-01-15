<template>
  <div id="app">
    <find-place v-if='!placeFound' @loaded='onGridLoaded'></find-place>
    <div v-if='placeFound'>
      <div class='controls'>
        <a href="#" @click.prevent='startOver'>Start over</a>
        <a href="#" class='print-button' @click.prevent='showPrintWindow=!showPrintWindow'>Print...</a>
      </div>
      <div class='preview-actions message' v-if='zazzleLink || generatingPreview'>
          <div v-if='zazzleLink' class='padded popup-help'>
            If your browser has blocked the new window, <br/>please <a :href='zazzleLink' target='_blank'>click here</a>
            to open it.
          </div>
          <div v-if='generatingPreview' class='loading-container'>
            <loading-icon></loading-icon>
            Generating preview url...
          </div>
      </div>
      <div class='labels'>
        <h3>{{name}}</h3>
        <div class='license'>data <a href='https://www.openstreetmap.org/about/'>© OpenStreetMap</a></div>
      </div>
      <div v-if='showPrintWindow' class='print-window'>
        <div>
          <a href='#' @click.prevent='zazzleMugPrint()'>To a mug</a> 
          <span>
            Print what you see onto a mug. We use zazzle.com as our printer provider. Give it a try!
          </span>
        </div>
        <div>
          <a href='#'  @click.capture='toFile'>To a .PNG image</a> 
          <span>
            Save current screen as a raster image.
          </span>
        </div>
        <div>
          <a href='#'  @click.capture='toProtobuf'>To a .PBF file</a> 
          <span>
            Save current data as a protobuf message. For developer use only.
          </span>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import FindPlace from './components/FindPlace';
import LoadingIcon from './components/LoadingIcon';
import createScene from './lib/createScene';
import BoundingBox from './lib/BoundingBox';
import generateZazzleLink from './lib/getZazzleLink';
import appState from './lib/appState';

let lastGrid;

export default {
  name: 'App',
  components: {
    FindPlace,
    LoadingIcon,
  },
  data() {
    return {
      placeFound: false,
      name: '',
      zazzleLink: null,
      generatingPreview: false,
      showPrintWindow: false,
      showAdvanced: true
    }
  },
  beforeDestroy() {
    this.dispose();
  },
  methods: {
    dispose() {
      if (this.scene) {
        this.scene.dispose();
      }
    },

    onGridLoaded(name, grid) {
      this.placeFound = true;
      this.name = name.split(',')[0];
      let bounds = new BoundingBox();
      let nodes = new Map();
      let linkCount = 0;

      // TODO: async
      grid.elements.forEach(element => {
        if (element.type === 'node') {
          nodes.set(element.id, element);
          bounds.addPoint(element.lon, element.lat);
        } else if (element.type === 'way') {
          linkCount += element.nodes.length;
        }
      });
      lastGrid = grid;

      this.scene = createScene({grid, nodes, linkCount}, getCanvas(), bounds);
    },

    startOver() {
      this.dispose();
      this.placeFound = false;
      this.zazzleLink = null;
      this.showPrintWindow = false;
    },

    toFile(e) {
      let printableCanvas = this.getPrintableCanvas();
      let link = e.target;
      link.href = printableCanvas.toDataURL();
      link.download =  this.getFileName('.png');
    },

    getFileName(extension) {
      let fileName = (this.name + (new Date().toISOString())).replace(/[\s\W]/g, '_');
      return fileName + (extension || '');
    },

    toProtobuf(e) {
      if (!lastGrid) return;

      require.ensure('@/lib/protobufExport.js', () => {
        let arrayBuffer = require('@/lib/protobufExport.js')(lastGrid, this.name);
        let blob = new Blob([arrayBuffer.buffer], {type: "application/octet-stream"});
        let url = window.URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = lastGrid.areaId + '.pbf';
        a.click();
        window.URL.revokeObjectURL(url);
      });
    },

    zazzleMugPrint() {
      if (this.zazzleLink) {
        window.open(this.zazzleLink, '_blank');
        recordOpenClick(this.zazzleLink);
        return;
      }

      let printableCanvas = this.getPrintableCanvas();

      this.generatingPreview = true;
      generateZazzleLink(printableCanvas).then(link => {
        this.zazzleLink = link;
        window.open(link, '_blank');
        recordOpenClick(link);
        this.generatingPreview = false;
      }).catch(e => {
        this.error = e;
        this.generatingPreview = false;
      });
    },

    getPrintableCanvas() {
      let cityCanvas = getCanvas();
      let width = cityCanvas.width;
      let height = cityCanvas.height;

      let printable = document.createElement('canvas');
      let ctx = printable.getContext('2d');
      printable.width = width;
      printable.height = height;
      this.scene.render();
      ctx.drawImage(cityCanvas, 0, 0, cityCanvas.width, cityCanvas.height, 0, 0, width, height);

      if (appState.drawLabels) {
        drawHtml('.labels h3', ctx);
        drawHtml('.labels .license', ctx);
      }

      return printable;
    }
  }
}

function drawHtml(selector, ctx) {
  let element = document.querySelector(selector);
  if (!element) return;

  let computedStyle = window.getComputedStyle(element);
  let bounds = element.getBoundingClientRect();
  ctx.save();
  let dpr = window.devicePixelRatio || 1;
  let fontSize = dpr * Number.parseInt(computedStyle.fontSize, 10);

  ctx.font = fontSize + 'px ' + computedStyle.fontFamily;
  ctx.fillStyle = computedStyle.color;
  ctx.textAlign = 'end'
  ctx.fillText(element.innerText, bounds.right * dpr, bounds.bottom * dpr)
  ctx.restore();
}

function getCanvas() {
  return document.querySelector('#canvas')
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
@import('./vars.styl');

#app {
  margin: 8px;
  max-height: 100vh;
  position: absolute;
  h3 {
    font-weight: normal;
  }
}
.controls {
  height: 48px;
  background: white;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  width: desktop-controls-width;
  justify-content: space-around;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2), 0 -1px 0px rgba(0,0,0,0.02);
  a {
    text-decoration: none;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    color: highlight-color;
    &:hover, &:focus {
      color: emphasis-background;
      background: highlight-color;
    }
  }
  a.print-button {
    border-left: 1px solid border-color;
  }
}
.print-window {
  border-top: 1px solid border-color;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  width: desktop-controls-width;
  padding: 8px;

  div {
    margin-bottom: 12px;

  }
  a {
    text-decoration: none;
    color: highlight-color
  }
}

.message {
  border-top: 1px solid border-color
  border-bottom: 1px solid border-color
  background: #F5F5F5;
}


.preview-actions {
  display: flex;
  padding: 8px;
  width: desktop-controls-width;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  flex-direction: column;
  align-items: stretch;
  font-size: 14px;
  align-items: center;
  display: flex;

  .popup-help {
    text-align: center;
  }
}

.labels {
  text-align: right;
  position: fixed;
  right: 32px;
  bottom: 32px;
  font-family: 'Roboto', sans-serif;
  color: #434343;
  h3 {
    font-size: 24px;
    margin-bottom: 16px;
  }
  .license {
    color: #5F5F5F;
    font-size: 12px;
    a {
      text-decoration: none;
      color: #5F5F5F;
    }
  }
}

@media (max-width: small-screen) {
  #app {
    width: 100%;
    margin: 0;

    .preview-actions,.error, .suggestions, .search-box,
    .controls, .print-window {
      width: 100%;
    }
    .loading-container {
      font-size: 12px;
    }
    .labels {
      right: 8px;
      bottom: 8px;
      h3 {
        margin-bottom: 8px
      }
    }
  }

}

</style>
