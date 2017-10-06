<template>
  <div class='settings'>
    <div class='block vector-field'>
      <div class='title'>Vector field:</div>
      <pre>
<span class='comment'>// p.x and p.y are current coordinates
// v.x and v.y is a velocity at point p</span>
function velocity(<span class='type'>vec2</span> p) {
  <span class='type'>vec2</span> v = <span class='type'>vec2</span>(0., 0.);</pre>
      <textarea type='text' v-model='vectorField' rows='3'></textarea>
<pre>  return v;
}</pre>
      <div v-if='error' class='error'>{{error}}</div>
    </div>
    <div class='block'>

    </div>
  </div>
</template>
<script>
import bus from '../lib/bus';
export default {
  name: 'Settings',
  props: ['scene'],
  mounted() {
    bus.on('scene-ready', this.onSceneReady, this);
  },
  beforeDestroy() {
    bus.off('scene-ready', this.onSceneReady, this);
  },
  data() {
    return {
      error: '',
      vectorField: ''
    };
  },
  watch: {
    vectorField(newValue, oldValue) {
      // console.log(newValue, oldValue);
      this.sendVectorField();
    }
  },
  methods: {
    onSceneReady(scene) {
      this.vectorField = scene.getCurrentCode();
    },
    sendVectorField() {
      let result = this.scene.updateVectorField(this.vectorField);
      if (result && result.error) {
        this.error = result.error
      } else {
        this.error = '';
      }
    }
  }
}
</script>

<style lang='stylus'>
settings-width = 392px;
secondary-text = #99c5f1;

.error {
  color: red;
  font-family: monospace;
}
.settings {
  color: secondary-text;
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(6, 24, 56, 1.0);
  width: settings-width;
  border: 1px solid transparent;
  padding: 7px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.block {
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

@media (max-width: 600px) {
  .settings {
    width: 100%;
    top: 0;
    left: 0;
    .title {
      font-size: 14px;
      text-align: left;
    }
  }
  .vector-field {
    pre {
      display: none;
    }
    textarea {
      margin-top: 0;
      font-size: 16px;
      width: 100%;
    }
  }
}

</style>
