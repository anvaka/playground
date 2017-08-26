<template>
  <div class='graph-settings' :class='{hidden: !expanded}'>
    <a class='hide' @click.prevent='expanded = !expanded' href='#'>{{expanded ? "hide" : "show"}}</a>
    <h5>Settings</h5>
    <button @click.prevent='restartLayout()' class='restart'>Restart layout</button>

    <ClusterInfo :cluster='model.root'></ClusterInfo>
  </div>
</template>

<script>
var bus = require('../lib/bus');
var ClusterInfo = require('./ClusterInfo');
const initClusterModel = require('../lib/clusterModel');

export default {
  props: ['model'],
  components: {
    ClusterInfo
  },
  data() {
    return {
      expanded: true,
    }
  },

  methods: {
    restartLayout() {
      this.model.root.reset(true);
      bus.fire('restart-layout');
    },
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

.graph-settings h5 {
  margin: 2px;
}


</style>