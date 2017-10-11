<template>
  <div class='settings' :class='{collapsed: settingsPanel.collapsed}'>
    <div class='block vector-field'>
      <div class='title'>Vector field</div>
      <pre>
<span class='comment'>// p.x and p.y are current coordinates
// v.x and v.y is a velocity at point p</span>
function velocity(<span class='type'>vec2</span> p) {
  <span class='type'>vec2</span> v = <span class='type'>vec2</span>(0., 0.);</pre>
      <textarea type='text' v-model='vectorField' rows='3'></textarea>
<pre>  return v;
}</pre>
    <div class='error=container'>
      <pre v-if='error' class='error hl'>{{error}}</pre>
      <pre v-if='errorDetail' class='error detail'>{{errorDetail}}<span v-if='isFloatError'>
Did you forget to add a dot symbol? E.g. <span class='hl'>10</span> should be <span class='hl'>10.</span> and <span class='hl'>42</span> should be <span class='hl'>42.</span>
</span></pre>
    </div>
    </div>
    <div class='block'>
      <div class='row'>
        <div class='col'>Particles count </div>
        <div class='col full'><input type='text' v-model='particlesCount'></div>
      </div>
      <div class='row'>
        <div class='col'>Fade out speed</div>
        <div class='col full'><input type='text' v-model='fadeOutSpeed'></div>
      </div>
      <div class='row'>
        <div class='col'>Particle reset probability</div>
        <div class='col full'><input type='text' v-model='dropProbability'></div>
      </div>
      <div class='row'>
        <div class='col'>Integration timestep</div>
        <div class='col full'><input type='text' v-model='timeStep'></div>
      </div>
      <!--div class='row'>
        <div class='col'>Background color</div>
        <div class='col'>
          <color-picker :color='backgroundColor' @changed='updateBackground'></color-picker>
        </div>
      </div>
      <div class='row'>
        <div class='col'>Particle color</div>
        <div class='col'>
          <color-picker :color='particleColor' @changed='updateParticleColor'></color-picker>
        </div>
      </div-->
    </div>
  </div>
</template>
<script>
import bus from '../lib/bus';
import ColorPicker from './ColorPicker';
import appState from '../lib/appState';

export default {
  name: 'Settings',
  props: ['scene'],
  components:{
    ColorPicker
  },
  mounted() {
    bus.on('scene-ready', this.onSceneReady, this);
  },
  beforeDestroy() {
    bus.off('scene-ready', this.onSceneReady, this);
  },
  data() {
    return {
      error: '',
      errorDetail: '',
      isFloatError: false,
      vectorField: '',
      settingsPanel: appState.settingsPanel,
      particlesCount: 0,
      fadeOutSpeed: 0,
      dropProbability: 0,
      backgroundColor: '',
      particleColor: '',
      timeStep: 0,
    };
  },
  watch: {
    vectorField(newValue, oldValue) {
      // console.log(newValue, oldValue);
      this.sendVectorField();
    },
    particlesCount(newValue, oldValue) {
      this.scene.setParticlesCount(parseInt(newValue, 10));
    },
    timeStep(newValue, oldValue) {
      this.scene.setIntegrationTimeStep(newValue);
    },
    fadeOutSpeed(newValue, oldValue) {
      this.scene.setFadeOutSpeed(newValue);
    },
    dropProbability(newValue, oldValue) {
      this.scene.setDropProbability(newValue);
    }
  },
  methods: {
    updateBackground(rgba) {
      this.backgroundColor = toColorString(rgba);
      this.scene.setBackgroundColor(rgba);
    },
    updateParticleColor(rgba) {
      this.particleColor = toColorString(rgba);
      this.scene.setParticleColor(rgba);
    },
    onSceneReady(scene) {
      this.vectorField = scene.getCurrentCode();
      this.particlesCount = scene.getParticlesCount();
      this.fadeOutSpeed = scene.getFadeOutSpeed();
      this.dropProbability = scene.getDropProbability();
      this.backgroundColor = toColorString(scene.getBackgroundColor());
      this.particleColor = toColorString(scene.getParticleColor());
      this.timeStep = scene.getIntegrationTimeStep();
    },
    sendVectorField() {
      let result = this.scene.updateVectorField(this.vectorField);
      if (result && result.error) {
        this.error = result.error;
        this.errorDetail = result.errorDetail;
        this.isFloatError = result.isFloatError;
      } else {
        this.error = '';
        this.errorDetail = '';
        this.isFloatError = false;
      }
    },
  }
}

function toColorString({r, g, b, a}) {
  if (a === 1.0) {
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function hex(x) {
  let value = x.toString(16).toUpperCase();
  if (value.length === 1) value = '0' + value;
  return value;
}
</script>

<style lang='stylus'>
@import "./shared.styl";

.settings {
  color: secondary-text;
  position: absolute;
  top: control-bar-height;
  left: 0;
  background: window-background;
  width: settings-width;
  border: 1px solid transparent;
  padding: 7px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.settings.collapsed {
  display: none;
}
.block {
  .col {
    align-items: center;
    display: flex;
  }
  .row {
    margin-top: 4px;
  }
  input[type='text'] {
    background: transparent;
    color: white;
    border: 1px solid transparent;
    padding: 7px;
    font-size: 16px;
    width: 100%;
    margin-left: 7px;
    &:focus {
      outline: none;
      border: 1px dashed;
      background: #13294f;
    }
  }
}
.vector-field {
  pre {
    margin: 0;
    color: #6789ab;
    .comment {
      color: #435970;
      font-style: italic;
    }
  }

  pre.error {
    color: rgba(250, 232, 55, 1);
    overflow-y: auto;
  }
  pre.error.detail {
    overflow: none;
    white-space: normal;
    .hl {
      background-color: #172A4D;
      color: red;
      font-weight: bold;
    }
  }

  .title {
    text-align: center;
    margin-bottom: 7px;
    color: white;
    font-size: 18px;
  }
  textarea {
    background: transparent;
    color: white;
    font-family: monospace;
    margin-top: 14px;
    padding: 0;
    padding-left: 14px;
    width: settings-width - 14px;
    font-size: 18px;
    border: 1px solid transparent;
    &:focus {
      outline: none;
      border: 1px dashed;
      background: #13294f;
    }
  }
}

.row {
  display: flex;
  flex-direction: row;
}

.col {
  flex: 1;
}
a {
  text-decoration: none;
}

a.action {
  color: white;
  font-size: 16px;
}

a.toggle-settings {
  position: absolute;
  right: 8px;
  color: #999;
  font-size: 12px;
}
.settings.collapsed {
  height: 24px;
  width: auto;
  padding: 0 7px;
  a.toggle-settings {
    color: white;
    position: static;
    margin: 0;
    top: 0;
    left: 0
  }
}

@media (max-width: 600px) {
  .settings {
    width: 100%;
    top: 42px;
    left: 0;
    .title {
      font-size: 14px;
      text-align: left;
    }
  }

  .settings.collapsed {
    width: 100%;
    height: 38px;
  }
  .vector-field {
    textarea {
      margin-top: 0;
      font-size: 16px;
      width: 100%;
    }
  }
}

</style>
