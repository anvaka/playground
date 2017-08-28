<template>
  <div class='graph-settings' :class='{hidden: !expanded}'>
    <a class='hide' @click.prevent='expanded = !expanded' href='#'>{{expanded ? "hide" : "show"}}</a>
    <h3>Settings</h3>
    <div class='commands'>
      <a href='#' @click.prevent='restartLayout'>Restart layout</a>
      <a href='#' @click.prevent='toggleLinks'>Toggle links</a>
      <a href='#' @click.prevent='showDot'>Show Dot</a>
    </div>
    <ClusterInfo :cluster='model.selectedCluster' :model='model'></ClusterInfo>
    <div class='separator'></div>
    <NodeInfo v-if='selectedPoint' :point='selectedPoint' :model='model'></NodeInfo>
  </div>
</template>

<script>
var bus = require('../lib/bus');
var toDot = require('ngraph.todot');
var ClusterInfo = require('./ClusterInfo');
var NodeInfo = require('./NodeInfo');
var initClusterModel = require('../lib/clusterModel');

export default {
  props: ['model'],
  components: {
    ClusterInfo,
    NodeInfo
  },
  data() {
    return {
      expanded: true,
      selectedPoint: null
    }
  },

  calculated: {
    selectedCluster() {
      return this.model.root;
    }
  },
  
  mounted() {
    bus.on('select-node', this.handleSelectNode, this);
  },

  beforeDestroy() {
    bus.off('select-node', this.handleSelectNode);
  },

  methods: {
    restartLayout() {
      this.model.root.reset(true);
      bus.fire('restart-layout');
    },
    showDot() {
      let dot = toDot(this.model.selectedCluster.graph);
      bus.fire('show-dot', dot);
    },
    toggleLinks() {
      bus.fire('toggle-links');
    },
    handleSelectNode(nodeId) {
      this.selectedPoint = nodeId;
    }
  }
}

</script>
<style>
.commands {
  display: flex;
  justify-content: space-between;
  font-size: small;
}
.commands a {
  border: 1px solid;
  text-align: center;
  padding: 0 4px
}
.graph-settings {
  width: 260px;
  position: absolute;
  background: rgba(12, 41, 82, 0.89);
  border: 1px solid rgba(114, 248, 252, 0.2);
  color: rgb(244, 244, 244);
  top: 0;
  padding: 7px;
  max-height: 100%;
  overflow-y: auto;
  text-align: left;
}

.graph-settings select {
  margin: -14px;
  padding: 0;
}

.graph-settings input,
.graph-settings select {
  background: transparent;
  border: 1px solid transparent;
  color: RGB(114, 248, 252);
}
.graph-settings a {
    text-decoration: none;
    color: RGB(114, 248, 252);
}
.graph-settings .cluster-list a {
    display: inline-block;
    width: 100%;
    margin-bottom: 8px;
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

.graph-settings h3 {
  margin: 2px;
}

.graph-settings h5 {
  margin: 0;
}
.separator {
  width: 100%;
  margin: 14px 0;
  border-bottom: 1px solid rgb(33, 83, 115);
}

</style>