<template>
  <div class='controls'>
    <a href='#' @click.prevent='togglePaused' class='action'>{{paused ? "Resume" : "Pause"}}</a>
    <a href='#' @click.prevent='toggleSettings' class='action'>{{(settingsPanel.collapsed ? "Show" : "Hide") + " settings"}}</a>
  </div>
</template>

<script>
import appState from '../lib/appState';

export default {
  data() {
    return {
        paused: false,
        settingsPanel: appState.settingsPanel
    }
  },

  methods: {
    togglePaused() {
      this.paused = !this.paused;
      window.scene.setPaused(this.paused);
    },
    toggleSettings() {
      this.settingsPanel.collapsed = !this.settingsPanel.collapsed;
    }
  }
}
</script>
<style lang='stylus'>
@import "./shared.styl";

.controls {
  display: flex;
  position: absolute;
  top: 0px;
  height: control-bar-height;
  width: settings-width;
  left: 0;
  background-color: window-background;
  border-bottom: 1px solid secondary-text;

  a {
    padding: 8px;
    display: flex;
    flex: 1;
    border-right: 1px solid secondary-text;
    justify-content: center;
    align-items: center;
  }
  a.small {
  }
}

@media (max-width: small-screen) {
  .controls {
    top: 0;
    width: 100%;
  }
}

</style>
