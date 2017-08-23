<template>
<div>
    <h5>Clusters</h5>
    <button @click.prevent='detectClusters()'>Detect clusters</button>
    <ClusterInfo v-for='clusterLevel in levels' :key='clusterLevel.requestId' :cluster='clusterLevel'></ClusterInfo>
</div>
</template>
<script>
const bus = require('../lib/bus');
const ClusterInfo = require('./ClusterInfo');

export default {
  props: ['graph'],
  components: {
    ClusterInfo
  },
  data() {
    return {
      levels: []
    };
  },

  mounted() {
      bus.on('restart-layout', this.resetState, this);
      bus.on('clusters-ready', this.clusterReady, this);
  },

  beforeDestroy() {
      bus.off('restart-layout', this.resetState);
  },

  methods: {
    resetState() {
      this.levels = [];
    },

    detectClusters() {
      let levels = this.levels;
      let levelsCount = levels.length
      let graph = levelsCount ? levels[levelsCount - 1].clusterGraph : this.graph;

      bus.fire('detect-clusters', {
        graph,
        getAllSrcNodesInCluster,
        requestId: levelsCount,
      });

      function getAllSrcNodesInCluster(clusterData) {
      if (levelsCount === 0) {
          return Array.from(clusterData);
        } else {
          debugger;
          let allNodes = [];
          let prevLayer = levels[levelsCount - 1];

          clusterData.forEach(nodeId => {
            let prevData = prevLayer.clusterGraph.getNode(nodeId).data;
            let nodes = prevLayer.getAllSrcNodesInCluster(prevData);
            allNodes = allNodes.concat(nodes);
          })
          return allNodes;
        }
      }
    },

    clusterReady(e) {
      this.levels.push(e);
    }
  }
}
</script>

