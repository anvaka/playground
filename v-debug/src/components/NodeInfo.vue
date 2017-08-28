<template>
  <div class='node-info'>
    <h5>{{point}}</h5>
    <div>Cluster path</div>

    <div class='cluster-path-container'>
    <span v-for='cluster in clusterPath' :key='cluster.id'>
      <a href='#' @click.prevent='selectCluster(cluster)' @mouseover="highlightCluster(cluster)">{{cluster.id}}</a>
      <span class='cluster-name-separator'>&gt;</span>
    </span>
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
.cluster-name-separator {
  margin: 0 10px;
}

.cluster-path-container span:last-child .cluster-name-separator {
  display: none;
}
</style>
