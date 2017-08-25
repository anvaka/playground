<template>
<div>
    <h5>Settings</h5>
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
    let model = initClusterModel(this.graph);
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
      if (this.model) {
        // todo: dispose
      }
      this.model = initClusterModel(this.graph);
    },
    detectClusters() {
      let e = this.clusterModel.detectNextClusterLevel()
      this.levels.push(e);
      bus.fire()
    }
  }
}
</script>

