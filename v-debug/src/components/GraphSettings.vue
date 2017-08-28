<template>
  <div class='graph-settings' :class='{hidden: !expanded}'>
    <a class='hide' @click.prevent='expanded = !expanded' href='#'>{{expanded ? "hide" : "show"}}</a>
    <h3>Settings</h3>
    <button @click.prevent='restartLayout()' class='restart'>Restart layout</button>
    <button @click.prevent='toggleLinks'>Toggle original links</button>
    <ClusterInfo :cluster='model.selectedCluster' :model='model'></ClusterInfo>
    <hr>
    <NodeInfo v-if='selectedPoint' :point='selectedPoint' :model='model'></NodeInfo>
  </div>
</template>

<script>
var bus = require('../lib/bus');
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
.graph-settings {
  width: 260px;
  position: absolute;
  background: white;
  top: 0;
  padding: 7px;
  max-height: 100%;
  overflow-y: auto;
  text-align: left;
}
.restart {
  margin-bottom: 10px;
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

</style>