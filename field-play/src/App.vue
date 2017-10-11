<template>
  <div id="app">
    <ruler></ruler>
    <settings :scene='scene'></settings>
    <controls></controls>
  </div>
</template>

<script>
import Ruler from './components/Ruler';
import Settings from './components/Settings';
import Controls from './components/Controls';
import bus from './lib/bus';

export default {
  name: 'app',
  mounted() {
    this.scene = window.scene;
    bus.fire('scene-ready', window.scene);
  },
  data() {
    return {
      scene: null
    };
  },
  components: {
    Ruler,
    Settings,
    Controls
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
