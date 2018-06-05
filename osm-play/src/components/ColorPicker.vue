<template>
<div class='vue-colorpicker' @click='showPicker = !showPicker' v-click-outside='hide'>
  <span class='vue-colorpicker-btn' :style='btnStyle'></span>
  <div class='vue-colorpicker-panel' v-show='showPicker'>
    <component :is='pickerType' v-model='colors' @input='changColor'></component>
  </div>
</div>
</template>

<script>
import tinycolor from 'tinycolor2'
import { Sketch } from 'vue-color'
import ClickOutside from './clickOutside.js'

export default {
  name: 'vue-colorpicker',
  components: {
    'sketch-picker': Sketch,
  },
  directives: { ClickOutside },
  props: {
    value: {
      type: String,
    },
  },
  data () {
    return {
      showPicker: false,
      colors: {
        hex: '#FFFFFF',
        a: 1
      },
      colorValue: '#FFFFFF'
    }
  },
  computed: {
    pickerType () {
      return 'sketch-picker';
    },
    isTransparent () {
      return this.colors.a === 0;
    },
    btnStyle () {
      if (this.isTransparent) {
        return {
          background: '#eee',
          backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,.25) 25%, transparent 0, transparent 75%,rgba(0,0,0,.25)0), linear-gradient(45deg, rgba(0,0,0,.25)25%,transparent 0, transparent 75%,rgba(0,0,0,.25)0)',
          backgroundPosition: '0 0, 11px 11px',
          backgroundSize: '22px 22px'
        }
      }
      return {
        background: this.colorValue
      }
    },
  },
  watch: {
    showPicker (newVal) {
    //  this.updatePopper()
    },
    value (val, oldVal) {
      if (val !== oldVal) {
        this.updateColorObject(val)
      }
    }
  },

  methods: {
    hide () {
      this.showPicker = false
    },
    changeColor (data) {
      this.colorValue = tinycolor(data.rgba).toRgbString()
      this.$emit('input', this.colorValue)
      this.$emit('change', this.colorValue)
    },
    updateColorObject (color) {
      if (!color) return
      const colorObj = tinycolor(color || 'transparent')
      if (!color || color === 'transparent') {
        this.colors = {
          hex: '#FFFFFF',
          hsl: { h: 0, s: 0, l: 1, a: 0 },
          hsv: { h: 0, s: 0, v: 1, a: 0 },
          rgba: { r: 255, g: 255, b: 255, a: 0 },
          a: 0
        }
      } else {
        this.colors = {
          hex: colorObj.toHexString(),
          hsl: colorObj.toHsl(),
          hsv: colorObj.toHsv(),
          rgba: colorObj.toRgb(),
          a: colorObj.getAlpha()
        }
      }
      this.colorValue = colorObj.toRgbString()
    }
  },
  mounted () {
    this.updateColorObject(this.value)
  }
}
</script>

<style lang="stylus" scoped>
.vue-colorpicker {
  display: inline-block;
  box-sizing: border-box;
  height: 36px;
  padding: 6px;
  border: 1px solid #bfcbd9;
  border-radius: 4px;
  font-size: 0;
  cursor: pointer;
  &-btn {
    display: inline-block;
    width: 22px;
    height: 22px;
    border: 1px solid #666;
    background: #FFFFFF;
  }
}
</style>