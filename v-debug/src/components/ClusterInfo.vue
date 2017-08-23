<template>
  <div class='cluster-info'>
    <div>Level: {{cluster.requestId}}; Nodes: {{cluster.clusterGraph.getNodesCount()}}; Edges: {{cluster.clusterGraph.getLinksCount()}}</div>
  </div>
</template>
<script>
export default {
  props: ['cluster']
}
</script>


<style>
.cluster-info {
  text-align: left;
}
</style>
