<template>
  <a class='elevation' href='#' @click.prevent='toggleTheme'>
    <div class='map-text header'>Elevation</div>
    <div class='canvas-container'>
      <div class='labels'>
        <div v-for="(label, index) in computedLabels" :key="index" class='map-text' :style='label.style'>{{label.title}}</div>
      </div>
      <canvas class='elevation-legend' ref='elevation'></canvas>
    </div>
  </a>
</template>
<script>
import { createColorRampArray, toHexColorFromInt } from "../lib/createColorRampCanvas";
import appState from '../appState';

export default {
  name: 'Elevation',
  data() {
    return appState;
  },
  watch: {
    theme() {
      this.updateCanvas();
    }
  },
  computed: {
      colorHeight() { return 160 },
      computedLabels() {
        return getLabelsOffsets(160);
      }
  },
  mounted() {
    this.updateCanvas();
  },
  methods: {
    toggleTheme() {
      appState.setNextTheme();
    },
    updateCanvas() {
      let canvas = this.$refs.elevation;
      let ctx = canvas.getContext('2d');
      let width = ctx.width = canvas.width = 22;
      let height = ctx.height = canvas.height = this.colorHeight;
      let colors = createColorRampArray(appState.theme);

      let dx = 8;
      for (let i = 0; i < colors.length; ++i) {
        let offset = Math.round((i / colors.length) * height);
        ctx.fillStyle = toHexColorFromInt(colors[colors.length - i - 1]);
        ctx.fillRect(dx + 1, offset, width -dx - 2, offset);
      }

      ctx.fillStyle = 'black';
      for (let i = 0; i <= 5; ++i) {
        let offset = Math.round((i / 5) * height);
        ctx.fillRect(2, offset - (i === 0 ? 0 : 1), width, 1);
      }

      ctx.lineWidth = 1;
      ctx.strokeRect(dx, 0, width - dx, height)
    }
  }
}

function getLabelsOffsets(height) {
  let from = -9;
  let to = 21;
  let count = 5;
  const halfFontSize = 8;
  let dx = (to - from) / count;
  let labels = [];
  for (let i = 0; i <= count; ++i) {
    labels.push({
      style: {
        top: (height * (i / count) - halfFontSize) + 'px'
      },
      title: `${to - i * dx}km`
    });
  }

  return labels;
}

</script>
<style lang="stylus">
.elevation .map-text {
  color: #fff;
  font-size: 10px;
}
.map-text.header {
  padding-bottom: 12px;
  font-size: 16px;
}
.labels {
  position: absolute;
  right: 26px;
  .map-text {
    position: absolute;
    right: 0px;
  }
}
.canvas-container {
  position: relative;
}

.elevation-legend {
}

</style>