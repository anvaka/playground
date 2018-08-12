<template>
  <div v-if='vm' class='item-tooltip' v-bind:style="{ left: vm.pos.x + 'px', top: vm.pos.y + 'px' }"
       v-clap.prevent='onTap'>
    <img :src='vm.img' :width='vm.width'/>
    <div class='tooltip-details'>
      <h4>{{vm.title}}</h4>
      <div class='footer'></div>
    </div>
  </div>
</template>

<style lang='stylus'>
@import './variables.styl'

.item-tooltip
  position: fixed
  display: flex
  z-index: 3
  flex-direction: row
  box-shadow: 0 0 10px rgba(0,0,0,0.2)
  width: 320px
  height: 80px
  background: white

  img
    height: 80px
    width: auto

.tooltip-details
  position: relative
  flex: 1
  overflow: hidden
  h4
    font-size: 15px
    line-height: 16px
    font-weight: normal
    margin: 0
    padding: 10px

  .footer
    position: absolute
    bottom: 0
    width: 100%
    height: 10px
    background: linear-gradient(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 1))

@media (max-width: $screen-sm-min)
  .item-tooltip
    right: 0
    width: inherit
</style>

<script>
import bus from '../lib/bus.js'

export default {
  props: ['vm'],
  methods: {
    onTap(e) {
      if (e.touches && e.touches.length > 0) return;

      bus.fire('showDetails', this.vm.asin);
    }
  }
}
</script>