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
const initClusterModel = require('../lib/clusterModel');

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
      this.clusterModel = initClusterModel(this.graph);
  },

  beforeDestroy() {
      bus.off('restart-layout', this.resetState);
  },

  methods: {
    resetState() {
      this.levels = [];
    },
    detectClusters() {
      let e = this.clusterModel.detectNextClusterLevel()
      this.levels.push(e);
      bus.fire('clusters-ready', e);
    }
  }
}
</script>

