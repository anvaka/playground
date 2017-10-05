<template>
  <div class='ruler'>
    <div class='horizontal'>
      <div class='tick' v-for='tick in hticks' :style='{left: tick.offset}'>
        {{tick.label}}
      </div>
      <div class='tick v' v-for='tick in vticks' :style='{top: tick.offset}'>
        {{tick.label}}
      </div>
    </div>
  </div>
</template>
<script>
import bus from '../lib/bus';

  export default {
    name: 'Ruler',
    mounted() {
      bus.on('bbox-change', this.recomupteLabels, this);
    },
    beforeDestroy() {
      bus.off('bbox-change', this.recomupteLabels, this);
    },

    data() {
      return {
        hticks: [],
        vticks: [],
      };
    },
    methods: {
      recomupteLabels(bbox) {
        console.log('recomputing')
        let hticks = [];
        let vticks = [];
        let width = window.innerWidth;
        let height = window.innerHeight;
        var tickCount = 10;
        let {minX, minY, maxX, maxY} = bbox;
        let dx = (maxX - minX)/tickCount;
        let dy = (maxY - minY)/tickCount;
        var hstep = width/tickCount;
        var vstep = height/tickCount;
        var start = 0;
        for (var i = 0; i <= tickCount; ++i) {
          hticks.push({
            offset: i * hstep + 'px',
            label: (dx * i + minX).toFixed(2)
          });

          vticks.push({
            offset: i * vstep + 'px',
            label: (dy * i + minY).toFixed(2)
          });
        }
        this.hticks = hticks;
        this.vticks = vticks;
      }
    }
  }
</script>
<style lang='stylus'>

.ruler {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  color: #99c5f1;
}
.horizontal {
  top: 0;
  left: 0;
  right: 0;
  .tick {
    position: absolute;
  }
  .tick.v {
    right: 8px;
  }
}
.tracker {
  position: absolute;
  left: -5px;
  top: -5px;
  width: 10px;
  height: 10px;
  background-color: orange;
}
</style>

