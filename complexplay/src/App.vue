<template>
  <div id='app'>
    <div class='controls-container'>
    <a href='#' @click.prevent='toggleSettings' class='action'>{{(settingsPanel.collapsed ? "Advanced..." : "Hide settings")}}</a>
    <a href='#' @click.prevent='generateNewFunction'>Randomize</a>
    <a href='#' @click.prevent='openShareDialog' class='share-btn' title='Share'>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="18" height="18" viewBox="0 0 12 14">
<path d="M9.5 8q1.039 0 1.77 0.73t0.73 1.77-0.73 1.77-1.77 0.73-1.77-0.73-0.73-1.77q0-0.094 0.016-0.266l-2.812-1.406q-0.719 0.672-1.703 0.672-1.039 0-1.77-0.73t-0.73-1.77 0.73-1.77 1.77-0.73q0.984 0 1.703 0.672l2.812-1.406q-0.016-0.172-0.016-0.266 0-1.039 0.73-1.77t1.77-0.73 1.77 0.73 0.73 1.77-0.73 1.77-1.77 0.73q-0.984 0-1.703-0.672l-2.812 1.406q0.016 0.172 0.016 0.266t-0.016 0.266l2.812 1.406q0.719-0.672 1.703-0.672z"></path>
</svg>
</a>
    </div>
    <div class='settings' v-if='!settingsPanel.collapsed'>
      <div class='block' v-if='fractalCode'>
        <div class='title'>Fractal</div>
        <code-editor :model='fractalCode' ></code-editor>
      </div>
      <div class='block' v-if='fractalCode'>
        <a href="#" @click.prevent='goToOrigin'>Go to origin</a>
      </div>
    </div>
  </div>
</template>

<script>
import CodeEditor from './components/CodeEditor';

var bus = require('./bus');
var appState = require('./appState');
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
      settingsPanel: appState.settingsPanel,
      fractalCode: scene.fractalEditorState
    }
  },
  methods: {
    toggleSettings() {
      this.settingsPanel.collapsed = !this.settingsPanel.collapsed;
    },
    onSceneReady() {
      this.fractalCode = scene.fractalEditorState;
    },
    goToOrigin() {
      scene.goToOrigin();
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

.controls-container {
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
