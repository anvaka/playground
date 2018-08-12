<template>
<div>
  <div v-if='vm.visible'
       class='graph-overview col shadow'
       transition='toolbar'>
    <div class='header'>
      <h2>Showing <span class='accent'>{{vm.items.length}}</span> products
        <a href='#' class='close-panel' v-clap.prevent='hideList' title='collapse this list'><i class="material-icons">close</i></a>
      </h2>
      <div class='row'>
      <div>Sort</div>
        <drop-click :items='vm.sortMethods'
          :selected='vm.selectedMethod'
          v-on:change='vm.updateSort'
          prefix=' by '
          class='sort-method'
          ></drop-click>
      </div>
    </div>
    <ul class='sort-results'>
      <li v-for='item in vm.items'
          :title='item.title'
          :key='item.asin'
          @mouseenter='highlightLinks(item)'
          v-clap.prevent='() => showDetails(item)'
          :data-asin='item.asin'>
        <div class='product-image'>
          <img class='cover' :src='item.icon.URL'>
        </div>
        <div class='product-details'>
          <h3>{{item.title}}</h3>
          <component :is='currentSortValue' :name='vm.selectedMethod' :value='vm.getValue(item)'></component>
        </div>
      </li>
    </ul>
  </div>
  <a v-if='showListResults' class='list-results shadow btn no-print' href='#' v-clap.prevent='showList' title='show the list of found products'>
    <i class='material-icons'>list</i>
    <span class='label'>List products</span>
  </a>
</div>
</template>

<style lang='stylus'>
@import './variables.styl'
.toolbar-transition
  transition: all .3s ease
.toolbar-enter, .toolbar-leave
  transform: translate($sidebar-width, 0)
.graph-overview
  height: 100%
  width: $sidebar-width
  position: absolute
  right: 0
  z-index: 1
  background: white
  -webkit-overflow-scrolling: touch
  .close-panel
    display: inline-block
    height: 32px
    float: right
    padding-top: 3px
    margin-right: -18px
    width: 55px
    text-align: center
    color: $primary-text
  .close-panel:hover
    color: $cc-A200
  .header
    background: white
    padding: 10px 18px 10px 18px
    border-bottom: 1px solid $border-color
    height: 80px
    h2
      margin: 0 0 8px 0
      font-weight: normal
    .sort-method
      padding-left: 8px
  .sort-results
    flex: 1
    overflow-y: auto
  .product-image
    padding-right: 10px
  .product-details
    flex: 1
  img.cover
    width: 60px
    height: auto
  h3
    margin: 0
    font-weight: normal
    font-size: 18px
    line-height: 19px
    max-height: 38px
    overflow: hidden
  ul
    list-style-type: none
    margin: 0
    padding: 0
  li
    color: $primary-text
    display: flex
    flex-direction: row
    cursor: pointer
    padding: 10px 18px
    height: 112px
    border-bottom: 1px solid $border-color
    &:hover,
    &:focus,
    &.js-hover
      background-color: $c-50
.list-results
  position: fixed;
  right: 0;
  top: 8px;
  background: white;
  color: $primary-text;
  font-size: 42px;
  width: 35px;
  text-align: center;
  .label
    display: none
@media (max-width: $screen-sm-min)
  .graph-overview
    width: 100%
  .toolbar-enter, .toolbar-leave
    transform: translate(0, 100vh)
  .list-results
    left: 0
    right: 0
    top: inherit
    clor: $accent-text
    bottom: 0px
    display: flex;
    justify-content: center;
    align-items: center;
    height: 42px;
    width: 100%
    .label
      display: inline-block
      padding-left: 8px
      font-size: 18px
</style>

<script>
import bus from '../lib/bus.js'
import scrollIntoView from 'scroll-iv'
import DropClick from './DropClick.vue'
import PlainTextSortValue from './SortValues/PlainText.vue'
import InDegreeSortValue from './SortValues/InDegree.vue'
import styleVariables from '../styleVariables.js'

export default {
  props: ['vm'],
  ready() {
    bus.on('firstProductFound', this.showSideBarIfNeeded, this)
    bus.on('showDetails', this.scrollIntoView, this)
  },
  destroyed() {
    bus.off('firstProductFound', this.showSideBarIfNeeded)
    bus.off('showDetails', this.scrollIntoView)
  },
  computed: {
    currentSortValue() {
      // TODO: Should this be a constant?
      if (this.vm.selectedMethod === 'Popularity') {
        return 'InDegreeSortValue'
      }
      return 'PlainTextSortValue'
    },
    showListResults() {
      return !this.vm.visible && this.vm.items.length > 0
    }
  },
  methods: {
    showDetails(item) {
      this.lastShowDetailTime = new Date()
      bus.fire('showDetails', item.asin)
    },
    highlightLinks(item) {
      this.clearHover()
      bus.fire('highlight', item.asin)
    },
    hideList() {
      bus.fire('hideList')
    },
    showList() {
      bus.fire('showList')
    },
    showSideBarIfNeeded() {
      if (this.vm.visible) return
      var availableWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
      if (availableWidth > styleVariables.screenSmall) {
        // forcefully open the list, since we have a lot of space and it should
        // help with discovery
        this.showList()
      }
    },
    scrollIntoView(asin) {
      if (!this.vm.visible) return
      if (this.lastShowDetailTime) {
        let diff = new Date() - this.lastShowDetailTime
        // this means that we've send message ourselves. Ignore it.
        if (diff < 50) return
      }
      let ui = this.$el.querySelector('[data-asin="' + asin + '"]')
      if (!ui) return
      if (this.animation) this.animation.cancel()
      this.animation = scrollIntoView(ui)
      this.clearHover()
      ui.classList.add('js-hover')
    },
    clearHover() {
      let previousHover = this.$el.querySelectorAll('.js-hover')
      for (var i = 0; i < previousHover.length; ++i) {
        previousHover[i].classList.remove('js-hover')
      }
    }
  },
  components: {
    DropClick,
    PlainTextSortValue,
    InDegreeSortValue
  }
}
</script>