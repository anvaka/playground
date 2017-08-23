<template>
  <div class='graph-settings' :class='{hidden: !expanded}'>
    <a class='hide' @click.prevent='expanded = !expanded' href='#'>{{expanded ? "hide" : "show"}}</a>
    <h5>Layout Settings</h5>
    <select @change='changeLayout'>
      <option value='ngraph' selected>NGraph</option>
      <option value='d3force'>D3 Force</option>
    </select>

    <div class='row'>
      <div class='label'>Steps count</div>
      <div class='value'><input v-model='settings.steps'></input></div>
    </div>
    <NLayoutSettings :settings='settings' v-if='isNGraph'></NLayoutSettings>
    <D3LayoutSettings :settings='settings' v-if='!isNGraph'></D3LayoutSettings>
    <button @click.prevent='restartLayout()'>Restart Layout</button>
    <hr>
    <ClusterTool :graph='graph'></ClusterTool>
  </div>
</template>

<script>
var bus = require('../lib/bus');
var NLayoutSettings = require('./NLayoutSettings');
var D3LayoutSettings = require('./D3LayoutSettings');
var ClusterTool = require('./ClusterTool');

export default {
  props: ['settings', 'graph'],
  components: {
    NLayoutSettings,
    D3LayoutSettings,
    ClusterTool,
  },
  computed: {
    isNGraph() {
      return this.settings.selectedLayout === "ngraph";
    }
  },
  data() {
    return {
      expanded: true
    }
  },

  methods: {
    restartLayout() {
      bus.fire('restart-layout', this.settings);
    },
    changeLayout(e) {
      this.settings.selectedLayout = e.target.value;
      this.restartLayout();
    }
  }
}

</script>
<style>
.graph-settings {
  width: 260px;
  position: absolute;
  background: white;
  top: 0;
  padding: 7px;
}

.hidden {
  height: 16px;
  overflow: hidden;
}

.hide {
  position: absolute;
  font-size: 8px;
  top: 12px;
  right: 10px;
}

.row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
}

.label {
  padding-right: 8px;
}
.graph-settings h5 {
  margin: 2px;
}


</style>