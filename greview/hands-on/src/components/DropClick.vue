<template>
<div class='drop-click-container'>
  <span class='drop-click-name' :title='selectedName' :class='{hover: hover}'>{{prefix}}{{selectedName}}</span>

  <select class='back-dropdown' 
        @change='updateSelected'
        @mouseenter='triggerMouseEnter(true)'
        @mouseleave='triggerMouseEnter(false)'
        @focus='triggerMouseEnter(true)'
        @blur='triggerMouseEnter(false)'>
    <option v-for='item in items'
        :selected='item.selected'
        :key='item.key'
        :value='getValue(item)'
        :disabled='item.disabled'>
      {{item.name}}
    </option>
  </select>
</div>
</template>

<style lang='stylus'>
@import './variables.styl'
.drop-click-container
  display: flex
  position: relative
  .back-dropdown
    position: absolute
    left: 0
    top: 0
    width: 100%
    height: 100%
    cursor: pointer
    opacity: 0
  .drop-click-name
    color: $primary-text
    border-bottom: 1px dotted $accent-text
    text-overflow: ellipsis
    overflow: hidden
    display: inline-block
    white-space: nowrap
    &.hover
      color: $accent-text
</style>

<script>
export default {
  props: {
    items: {
      default: []
    },
    selected: {
      default: ''
    },
    prefix: {
      default: ''
    }
  },
  data() {
    return {
      hover: false,
      currentSelected: this.$props.selected
    }
  },
  computed: {
    selectedName() {
      var selected = this.selected;
      var index = this.items.findByValue(selected);
      if (index) {
        return index.name;
      }
    }
  },
  methods: {
    getValue(item) {
      return item.value || item.name
    },
    triggerMouseEnter(isEnter) {
      this.hover = isEnter
    },
    updateSelected(e) {
      this.currentSelected = e.target.value;
      this.$emit('change', e.target.value);
    }
  }
}
</script>