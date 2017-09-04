<template>
  <div>
    <h4>Grid layout</h4>
    <a href='#' class='btn-command' @click.prevent='vm.moveToPosition'>Move nodes to grid</a>
    <a href='#' class='btn-command' @click.prevent='vm.pullNodes'>Pull nodes</a>
    <a href='#' class='btn-command' @click.prevent='vm.drawRoads'>Draw roads</a>
    <a href='#' class='btn-command' @click.prevent='toggleGrid'>Toggle grid</a>
    <a href='#' class='btn-command' @click.prevent='toggleTesselation'>Toggle Delaunay</a>
  </div>
</template>

<script>

export default {
  props: ['vm'],
  data() {
    return {
      gridVisible: false,
      tesselationVisible: false
    }
  },
  methods: {
    toggleGrid() {
      this.gridVisible = !this.gridVisible;
      this.vm.drawGrid(this.gridVisible);
    },
    toggleTesselation() {
      this.tesselationVisible = !this.tesselationVisible;
      this.vm.drawTesselation(this.tesselationVisible);
    }
  }
}
</script>
