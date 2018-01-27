<template>
  <div id='app'>
    <div class='controls-container'>
      <div class='settings'>
        <div class='block' v-if='fractalCode'>
          <div class='title'>Fractal</div>
          <code-editor :model='fractalCode' ></code-editor>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CodeEditor from './components/CodeEditor';

var bus = require('./bus');
var scene = window.scene;

export default {
  name: 'App',
  components: {
    CodeEditor
  },
  mounted() {
    bus.on('scene-ready', this.onSceneReady, this);
  },
  beforeDestroy() {
    bus.off('scene-ready', this.onSceneReady, this);
  },
  data() {
    return {
      fractalCode: scene.fractalEditorState
    }
  },
  methods: {
    onSceneReady() {
      this.fractalCode = scene.fractalEditorState;
    }
  }
}
</script>

<style lang='stylus'>
@import './styles/app.styl';
@import './shared.styl';
@import "./styles/glsl-theme.styl";

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.controls-container {
  position: absolute;
  max-height: 100%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);

  border: 1px solid primary-border;
  border-left: none;
  border-top: none;
  overflow: hidden;
  flex-direction: column;
  display: flex;
}

.settings {
  flex: 1;
  color: secondary-text;
  left: 0;
  overflow-y: auto;
  border-top: 1px solid secondary-text;
  background: window-background;
  width: 100%;
  padding: 7px 7px 7px 7px;
}
.settings.collapsed {
  display: none;
}

.title {
  margin-bottom: 7px;
  color: primary-text;
  font-size: 18px;
}

.block {
  .col {
    align-items: center;
    display: flex;
  }
  .row {
    margin-top: 4px;
  }
  select {
    margin-left: 14px;
  }

  input[type='text'],
  input[type='number'] {
    background: transparent;
    color: primary-text;
    border: 1px solid transparent;
    padding: 7px;
    font-size: 16px;
    width: 100%;
    margin-left: 7px;
    &:focus {
      outline-offset: 0;
      outline: none;
      border: 1px dashed;
      background: #13294f;
    }
    &:invalid {
      box-shadow:none;
    }
  }
}
@media (max-width: small-screen) {
  a.about-link {
    bottom: 14px;
  }

  .controls-container {
    width: 100%;
  }
}
</style>
