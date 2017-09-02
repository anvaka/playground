<template>
  <div>
    <h4>Grid layout</h4>
    <a href='#' @click.prevent='moveNodes'>Move nodes to grid</a>
  </div>
</template>

<script>

export default {
  props: ['vm'],
  methods: {
    moveNodes() {
      this.vm.moveToPosition();
    }
  }
}
</script>
