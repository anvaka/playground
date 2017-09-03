<template>
  <div>
    <h4>Grid layout</h4>
    <a href='#' class='btn-command' @click.prevent='vm.moveToPosition'>Move nodes to grid</a>
    <a href='#' class='btn-command' @click.prevent='vm.pullNodes'>Pull nodes</a>
    <a href='#' class='btn-command' @click.prevent='vm.drawRoads'>Draw roads</a>
  </div>
</template>

<script>

export default {
  props: ['vm']
}
</script>
