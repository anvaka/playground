<template>
  <canvas></canvas>
</template>

<script>
const makeScene = require('../lib/wgl/scene');

export default {
  name: 'Scene',
  mounted() {
    let canvas = this.$el;
    let scene = makeScene(canvas);
  }
}
</script>

<style>
  canvas {
    width: 100%;
    height: 100%;
  }
</style>


