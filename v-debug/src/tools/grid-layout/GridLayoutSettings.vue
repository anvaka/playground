<template>
  <div>
    <h4>Grid layout</h4>
    <a href='#' class='btn-command' @click.prevent='moveNodes'>Move nodes to grid</a>
    <a href='#' class='btn-command' @click.prevent='pullNodes'>Pull nodes</a>
  </div>
</template>

<script>

export default {
  props: ['vm'],
  methods: {
    moveNodes() {
      this.vm.moveToPosition();
    },
    pullNodes() {
      this.vm.pullNodes();
    }
  }
}
</script>
