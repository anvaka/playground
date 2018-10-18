<template>
  <div id="app">
    <a href="#" @click.prevent='reset'>Reset</a>
    <div>
      <div class='row'>
        <div class='label'>K1</div>
        <div class='value'><input v-model='settings.k1'></div>
      </div>
      <div class='row'>
        <div class='label'>K2</div>
        <div class='value'><input v-model='settings.k2'></div>
      </div>
      <div class='row'>
        <div class='label'>K3</div>
        <div class='value'><input v-model='settings.k3'></div>
      </div>
      <div class='row'>
        <div class='label'>K4</div>
        <div class='value'><input v-model='settings.k4'></div>
      </div>
    </div>
  </div>
</template>

<script>
import createScene from './scene.js';
import appState from './appState.js';

export default {
  name: 'App',
  components: {
  },
  data() {
    return {
      settings: appState.settings
    };
  },
  mounted() {
    this.scene = createScene(document.querySelector('.scene'))
  },
  watch: {
    'settings.k1': function(newValue, oldValue) {
      this.scene.updateLayoutParam(this.settings);
    },
    'settings.k2': function(newValue, oldValue) {
      this.scene.updateLayoutParam(this.settings);
    },
    'settings.k3': function(newValue, oldValue) {
      this.scene.updateLayoutParam(this.settings);
    },
    'settings.k4': function(newValue, oldValue) {
      this.scene.updateLayoutParam(this.settings);
    },
  },
  beforeDestroy() {
    if (this.scene) {
      this.scene.dispose();
      this.scene = null;
    }
  },
  methods: {
    updateK3() {
      console.log('k3');
    },
    reset() {
      this.scene.dispose();
      this.scene = createScene(document.querySelector('.scene'));
    }
  }

}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  position: absolute;
  color: rgb(244, 244, 244);
}
a {
  color: rgb(244, 244, 244);
  text-decoration: none;
  border-bottom: 1px dashed;
}

.row {
  display: flex;
  flex-direction: row;
  align-items: baseline;
}

.row .label {
  flex: 1;
}
.row .value {
  flex: 1;
}
.row select {
  width: 100%;
}
</style>
