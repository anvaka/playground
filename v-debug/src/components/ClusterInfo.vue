<template>
  <div class='cluster-info'>
    <div>Nodes: {{cluster.graph.getNodesCount()}}; Edges: {{cluster.graph.getLinksCount()}}</div>
    <div class='row'>
      <div class='label'>Layout</div>
      <div class='value'>
        <select @change='changeLayout'>
          <option value='ngraph' selected>NGraph</option>
          <option value='d3force'>D3 Force</option>
        </select>
      </div>
    </div>

    <div class='row'>
      <div class='label'>Steps count</div>
      <div class='value'><input v-model='cluster.settings.steps'></input></div>
    </div>
    <NLayoutSettings :settings='cluster.settings' v-if='isNGraph'></NLayoutSettings>
    <D3LayoutSettings :settings='cluster.settings' v-if='!isNGraph'></D3LayoutSettings>
    <button @click.prevent='requestSplit'>Split into clusters</button>
  </div>
</template>
<script>

var NLayoutSettings = require('./NLayoutSettings');
var D3LayoutSettings = require('./D3LayoutSettings');
var bus = require('../lib/bus');

export default {
  props: ['cluster'],
  components: {
    NLayoutSettings,
    D3LayoutSettings
  },

  computed: {
    isNGraph() {
      return this.cluster.settings.selectedLayout === "ngraph";
    }
  },

  methods: {
    changeLayout(e) {
      this.cluster.settings.selectedLayout = e.target.value;
      // this.restartLayout();
    },
    requestSplit() {
      bus.fire('request-split', this.cluster);
    }
  }
}
</script>


<style>
.cluster-info {
  border-top: 1px solid gray;
  text-align: left;
  padding: 14px 0;
}

.row {
  display: flex;
  flex-direction: row;
  align-items: baseline;
}

.row .label {
  flex: 1;
}
.row .value {
  flex: 1;
}
.row select {
  width: 100%;
}

</style>

