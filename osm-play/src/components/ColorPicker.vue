<template>
    <div class="input-group color-picker-component">
        <input type="text"
            class="form-control"
            title="Color Picker"
            :value="colorString"
            @focus="showPicker(item)"
            @blur="displayPicker = false"
            @change="updateFromInput"
        />
        <span class="input-group-addon color-picker-container">
            <span class="current-color"
                :style="'background-color: ' + colorString"
                @click="showPicker(item)"
            ></span>
                <material-picker :value="colors"
                    @input="updateFromPicker"
                    v-if="picker === 'material' && displayPicker"></material-picker>

                <compact-picker :value="colors"
                    @input="updateFromPicker"
                    v-if="picker === 'compact' && displayPicker"></compact-picker>

                <swatches-picker :value="colors"
                    @input="updateFromPicker"
                    v-if="picker === 'swatches' && displayPicker"></swatches-picker>

                <slider-picker :value="colors"
                    @input="updateFromPicker"
                    v-if="picker === 'slider' && displayPicker"></slider-picker>

                <sketch-picker :value="colors"
                    @input="updateFromPicker"
                    v-if="picker === 'sketch' && displayPicker"></sketch-picker>

                <chrome-picker :value="colors"
                    @input="updateFromPicker"
                    v-if="picker === 'chrome' && displayPicker"></chrome-picker>

                <photoshop-picker :value="colors"
                    @input="updateFromPicker"
                    v-if="picker === 'photoshop' && displayPicker"></photoshop-picker>

        </span>
    </div>
</template>
<script>
import * as picker from 'vue-color';

export default {
  name: 'ColorPicker',
  props: {
    picker: {
      type: String,
      required: true,
    },
    color: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      colors: {},
      displayPicker: false,
    }
  },
  computed: {
    colorType() {
      return this.item.colorType;
    },

    colorString() {
      if (!this.colors[this.colorType]) {
        return '';
      }

      if (this.colorType === 'hex') {
        return this.colors.hex;
      }

      return this.colorType + '(' + Object.values(this.colors[this.colorType]).join(',') + ')';
    },
  },
  methods: {
    showPicker(item) {
      if (item.color) {
        this.colors = item.color;
      }

      this.displayPicker = true;
    },

    updateFromPicker(value) {
      this.colors = value;
    },

    updateFromInput(event) {
    },
  },
  components: {
    'material-picker': picker.Material,
    'compact-picker': picker.Compact,
    'swatches-picker': picker.Swatches,
    'slider-picker': picker.Slider,
    'sketch-picker': picker.Sketch,
    'chrome-picker': picker.Chrome,
    'photoshop-picker': picker.Photoshop,
  },
}
</script>

<style lang="stylus">
    .color-picker-component{
        .current-color {
            display: inline-block;
            width: 16px;
            height: 16px;
            background-color: #000;
            cursor: pointer;
        }

        .vue-color__chrome {
            position: absolute;
            left: 0;
            top: calc(100% + 10px);
            z-index: 100;
        }
    }
</style>