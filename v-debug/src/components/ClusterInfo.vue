<template>
  <div class='cluster-info'>
    <div v-if='cluster.parent'>
      <a href='#' @mouseover.prevent='higlight(cluster.parent)' @click.prevent='setCluster(cluster.parent)'>Parent: {{cluster.parent.id}}</a>
    </div>
    <div>Custer: {{cluster.id}}</div>
    <div>Nodes: {{cluster.graph.getNodesCount()}}; Edges: {{cluster.graph.getLinksCount()}}; Mass: {{cluster.mass}}</div>
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
    <hr>
    <div v-for='child in getChildren(cluster)' :key='child.id'>
      <a href='#' @mouseover.prevent='higlight(child.cluster)' @click.prevent='setCluster(child.cluster)'>{{child.id}}. Mass: {{child.mass}}</a>
    </div>
  </div>
</template>
<script>

var NLayoutSettings = require('./NLayoutSettings');
var D3LayoutSettings = require('./D3LayoutSettings');
var bus = require('../lib/bus');

export default {
  props: ['cluster', 'model'],
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
    getChildren(cluster) {
      let nodes = []
      let massLookup = cluster.childrenLookup;
      cluster.graph.forEachNode(node => {
        let clusterInfo = massLookup.get(node.id);
        nodes.push({
          id: node.id,
          mass: clusterInfo ? clusterInfo.mass : 1,
          cluster: clusterInfo
        });
      })
      return nodes;
    },
    higlight(cluster) {
      if (cluster && cluster.buildNodePositions) bus.fire('highlight-cluster', cluster);
    },
    changeLayout(e) {
      this.cluster.settings.selectedLayout = e.target.value;
      // this.restartLayout();
    },
    requestSplit() {
      bus.fire('request-split', this.cluster);
    },
    setCluster(cluster) {
      if (cluster) this.model.selectedCluster = cluster;
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

