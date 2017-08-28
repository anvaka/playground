<template>
  <div class='node-info'>
    <h3>Selected point</h3>
    <div>{{point}}</div>

    <h5>Cluster path</h5>
    <div v-for='cluster in clusterPath' :key='cluster.id'>
      <a href='#' @click.prevent='selectCluster(cluster)' @mouseover="highlightCluster(cluster)">{{cluster.id}}</a>
      </div>
  </div>
</template>
<script>
const bus = require('../lib/bus');

export default {
  props: ['point', 'model'],
  computed: {
    clusterPath() {
      let clusterPath = this.model.getClusterPath(this.point); 
      return clusterPath;
    }
  },
  methods: {
    highlightCluster(cluster) {
      bus.fire('highlight-cluster', cluster);
    },

    selectCluster(cluster) {
      this.model.selectedCluster = cluster;
    }
  }
}
</script>

<style>
.node-info {
  text-align: left;
}
.node-info h3 {
  margin: 0
}
</style>
