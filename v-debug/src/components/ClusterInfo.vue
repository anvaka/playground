<template>
  <div class='cluster-info'>
    <h5>
      <span>Cluster: {{cluster.id}}</span>
<span class='stats'>(|V| = {{cluster.graph.getNodesCount()}}, |E| = {{cluster.graph.getLinksCount()}}<span v-if='cluster.mass'>, Mass: {{cluster.mass}}</span>)</span></h5>
    <div v-if='cluster.parent'>
      <span>Parent:</span>
      <a  href='#' @mouseover.prevent='higlight(cluster.parent)' @click.prevent='setCluster(cluster.parent)'>{{cluster.parent.id}}</a>
    </div>
    <h5>Children: </h5>
    <div class='cluster-list'>
      <a  v-for='child in getChildren(cluster)' :key='child.id' href='#' @mouseover.prevent='higlight(child.cluster)' @click.prevent='setCluster(child.cluster)'>{{child.id}}. Mass: {{child.mass}}</a>
    </div>
    <div class='separator'></div>
    <a href='#' @click.prevent='requestSplit' class='btn-command'>Split into clusters</a>
    <a href='#' @click.prevent='removeOverlaps' class='btn-command'>Remove overlaps</a>
    <a href='#' @click.prevent='pullTogegher' class='btn-command'>Pull together</a>
    <a href='#' @click.prevent='showBounds' class='btn-command' v-if='cluster.children'>Show bounds</a>
    <a href='#' @click.prevent='showDot' class='btn-command'>Show Dot</a>
    <div class='separator'></div>

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
  </div>
</template>
<script>

var NLayoutSettings = require('./NLayoutSettings');
var D3LayoutSettings = require('./D3LayoutSettings');
var bus = require('../lib/bus');
var toDot = require('ngraph.todot');

export default {
  props: ['cluster', 'model'],
  components: {
    NLayoutSettings,
    D3LayoutSettings
  },
  data() {
    return {
      boundsVisible: false
    };
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
    showDot() {
      let dot = toDot(this.cluster.graph);
      bus.fire('show-dot', dot);
    },
    showBounds() {
      this.boundsVisible = true;
      bus.fire('show-bounds', this.cluster);
    },
    changeLayout(e) {
      this.cluster.settings.selectedLayout = e.target.value;
      // this.restartLayout();
    },
    requestSplit() {
      this.boundsVisible = false;
      bus.fire('request-split', this.cluster);
    },
    removeOverlaps() {
      bus.fire('highlight-cluster', null);
      for (var i = 0; i < 10; ++i) this.cluster.removeOverlaps({
  //      drawLines: i === 9,
  //      precise: i === 9
      });
      if (this.boundsVisible) this.showBounds();
    },
    pullTogegher() {
      bus.fire('highlight-cluster', null);

      let pullSettings = { pullX: true };
      for (var i = 0; i < 10; ++i) this.cluster.removeOverlaps(pullSettings);
      if (this.boundsVisible) this.showBounds();
    },
    setCluster(cluster) {
      if (cluster) this.model.selectedCluster = cluster;
    }
  }
}
</script>


<style>
.cluster-info {
  border-top: 1px solid RGB(33, 83, 115);
  text-align: left;
  margin-top: 14px;
  padding: 14px 0;
}
.cluster-list {
  overflow-y: auto;
  max-height: 160px;
}
span.stats {
  display: inline;
  padding: 0;
  font-size: small;
  font-weight: 100;
  color: #69B;
}
</style>

