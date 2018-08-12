<template>
<div>
  <div v-show='vm.visible' class='details-container col' :class="{ 'list-open': listOpen }">
    <div class='mini-header row' v-if='miniVisible' transition='expand'>
      <a :href='product.link' target='_blank' title='Open on Amazon'>
        <img :src='vm.product.icon.URL' class='cover'/>
      </a>
      <div class='mini-details'>
        <div class='row'>
          <h4 :title='vm.product.title'>{{vm.product.title}}</h4>
          <a :href='product.link' class='accent tiny-link'>Amazon</a>
        </div>
        <div class='row description'>
          <div class='buy-btn'>
            <a :href='product.link' class='shop-btn' target='_blank' title='Open on Amazon'>
              <img src='../assets/amazon.svg'>
              <div>Amazon</div>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class='central-block col'>
      <div class='main-product-container' ref='container'>
        <div class='cover-container'>
          <a :href='product.link' target='_blank' title='Open on Amazon' class='product-cover' v-if='vm.product.image'>
            <img :src='vm.product.image.URL' class='cover'>
          </a>
        </div>
        <div class='buy-btn'>
          <a :href='product.link' class='shop-btn' target='_blank' title='Open on Amazon'>
            <img src='../assets/amazon.svg'>
            <div>Amazon</div>
          </a>
        </div>
        <attributes :product='vm.product' class='attributes-container'></attributes>
      </div>
    </div>

    <div class='actions'>
      <a href='#' class='btn primary'
        v-clap.prevent='closeDetails'>
        Close
      </a>
    </div>
  </div>
</div>
</template>

<script>
import bus from '../lib/bus.js'
import Attributes from './Attributes.vue'
import listResults from '../lib/sidebar/listResults.js'

export default {
  props: ['vm'],
  mounted() {
    let self = this

    let resetView = () => {
      if (self.$refs.container) {
        setTimeout(() => self.$refs.container.scrollIntoView(), 0)
      }
    }

    bus.on('showDetails', resetView)

    this.$el.addEventListener('scroll', handleScroll, true)
    this.beforeDestroy = function() {
      this.$el.removeEventListener('scroll', handleScroll, true)
      bus.off('showDetails', resetView)
    }

    function handleScroll(e) {
      let src = e.srcElement
      if (!src.classList.contains('central-block')) return

      let breakPoint = src.clientHeight < 600 ? 300 : 500
      self.scrolledBelowBreakpoint = src.scrollTop > breakPoint
    }
  },

  data() {
    return {
      scrolledBelowBreakpoint: false,
    }
  },

  components: {
    Attributes,
  },

  computed: {
    miniVisible() {
      return this.scrolledBelowBreakpoint
    },
    product() {
      return this.vm.product
    },
    listOpen() {
      return listResults.visible
    }
  },

  methods: {
    closeDetails() {
      this.vm.visible = false
    },
  }
}
</script>

<style lang='stylus'>
@import './variables.styl'

.product-cover {
  text-align: center;
}

.mini-header
  position: fixed
  height: 80px
  z-index: 1
  width: $sidebar-width
  background: white
  border-bottom: 1px solid $border-color

  .tiny-link
    display: none

  .mini-details
    flex: 1
    overflow: hidden
    margin: 8px
    h4
      flex: 1
      margin: 0 0 7px 0
      overflow: hidden
      font-weight: normal
      white-space: nowrap
      text-overflow: ellipsis
    .description
      justify-content: space-between
      height: 36px
      align-items: center
      .buy-btn
        margin: 0 0 0 10px
        width: 180px

  img.cover
    height: 80px
    width: auto
    box-shadow: none

.details-container
  height: 100%
  box-shadow: 0 0 10px rgba(0,0,0,0.2)
  width: $sidebar-width
  position: absolute
  right: 0
  z-index: 2
  background: white
  -webkit-overflow-scrolling: touch

  .central-block
    flex: 1
    overflow-y: auto
    overflow-x: hidden

  .actions
    border-top: 1px solid $border-color
    text-align: center;
    background: white
    height: $explore-btn-height
    display: flex
    justify-content: space-around
    a
      flex: 1
      line-height: $explore-btn-height
    a.primary
      border-right: 1px solid $border-color

  .buy-btn
    margin: 10px
  .shop-btn
    display: flex
    flex-direction: row
    align-items: center
    height: 36px
    border-color: #a88734 #9c7e31 #846a29
    color: rgb(17, 17, 17)
    border-radius: 2px;
    border-style: solid;
    border-width: 1px;
    background: linear-gradient(to bottom,#f7dfa5,#f0c14b)

    img
      padding: 0 3px

    div
     flex: 1
     margin-left: -32px
     text-align: center

  .attributes-container
    padding: 0 10px
    .product-title
      margin-top: 0
      margin-bottom: 4px
      font-weight: normal

  .cover-container
    display: flex
    flex-direction: column


.expand-transition {
  transition: all .2s ease;
}

.expand-enter, .expand-leave {
  opacity: 0
}

img.cover
  width: auto
  height: 500px
  align-self: center
  box-shadow: 0 0 10px rgba(0,0,0,0.2)

@media (min-width: $screen-lg)
  .details-container.list-open
     right: $sidebar-width
     z-index: 1

@media (max-width: 670px)
  .details-container,
  .mini-header
    width: 100%

  .cover-container
    float: left
    padding: 10px 16px 10px 10px
    img.cover
      height: 300px

@media (max-width: 500px)
  .cover-container
    float: none
    padding: 0

@media (max-width: $screen-sm-min)
  .details-container,
  .mini-header
     width: 100%
  .cover-container
    float: none
    padding: 0

@media (max-height: $screen-sm-min-height)
  img.cover
     height: 300px

@media (max-height: 320px)
  img.cover
     height: 150px
  .mini-header
    height: 40px
    img.cover
      height: 40px
    .tiny-link
      display: inline-block
</style>
