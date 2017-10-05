<template>
  <div id="app">
    <canvas ref='scene'></canvas>
    <ruler></ruler>
  </div>
</template>

<script>
import initScene from './lib/scene';
import Ruler from './components/Ruler';

export default {
  name: 'app',
  mounted() {
    var canvas = this.$refs.scene;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var gl = canvas.getContext('webgl', {antialiasing: false});
    this.scene = initScene(gl)
    this.scene.start();
  },
  data() {
    return {
    };
  },
  components: {
    Ruler
  },

  beforeDestroy() {
    if (this.scene) {
      this.scene.dispose();
      this.scene = null;
    }
  },
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

</style>
