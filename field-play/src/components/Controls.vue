<template>
  <div class='controls'>
    <a href='#' @click.prevent='togglePaused' class='action'>{{paused ? "Resume" : "Pause"}}</a>
    <a href='#' @click.prevent='toggleSettings' class='action'>{{(settingsPanel.collapsed ? "Change..." : "Hide settings")}}</a>
    <a href='#' @click.prevent='openShareDialog' class='share-btn' title='Share'>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="18" height="18" viewBox="0 0 12 14">
<path d="M9.5 8q1.039 0 1.77 0.73t0.73 1.77-0.73 1.77-1.77 0.73-1.77-0.73-0.73-1.77q0-0.094 0.016-0.266l-2.812-1.406q-0.719 0.672-1.703 0.672-1.039 0-1.77-0.73t-0.73-1.77 0.73-1.77 1.77-0.73q0.984 0 1.703 0.672l2.812-1.406q-0.016-0.172-0.016-0.266 0-1.039 0.73-1.77t1.77-0.73 1.77 0.73 0.73 1.77-0.73 1.77-1.77 0.73q-0.984 0-1.703-0.672l-2.812 1.406q0.016 0.172 0.016 0.266t-0.016 0.266l2.812 1.406q0.719-0.672 1.703-0.672z"></path>
</svg>
</a>
  </div>
</template>

<script>
import appState from '../lib/appState';
import bus from '../lib/bus';

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
    },
    openShareDialog() {
      bus.fire('open-share-dialog');
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
  a.share-btn {
    display: none;
    svg {
      fill: white;
    }
  }
  a.small {
  }
}

@media (max-width: small-screen) {
  .controls {
    top: 0;
    width: 100%;
    a.share-btn {
      flex: none;
      display: flex;
      width: 42px;
    }
  }
}

</style>
