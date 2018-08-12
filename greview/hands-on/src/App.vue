<template>
  <div id="app">
    <div class='copy secondary'>
      (C) 2018 <a href='https://twitter.com/anvaka' class='secondary' target='_blank'>Andrei Kashcha</a>
    </div>
    <list-results :vm='listResults'></list-results>
    <product-details :vm='details'></product-details>
    <tooltip :vm='graphStore.tooltip'></tooltip>
    <map-details></map-details>
  </div>
</template>

<script>
import appState from './appState.js';
import ListResults from './components/ListResults'
import ProductDetails from './components/Details'
import Tooltip from './components/Tooltip'
import MapDetails from './components/MapDetails';

export default {
  name: 'app',
  components: {
    ListResults,
    ProductDetails,
    Tooltip,
    MapDetails
  },

  data() {
    return appState
  }
}
</script>

<style lang="stylus">
@import './components/variables.styl'
.copy {
  position: absolute
  bottom: 8px
  left: 8px
  font-size: x-small
}

svg a {
  cursor: pointer;
}

.icon-button
  color: white
.col
  display: flex
  flex-direction: column
.row
  display: flex
  flex-direction: row
.wrap
  flex-wrap: wrap
a
  text-decoration: none
.accent
  color: $cc-A200
.accent.secondary
  color: $cc-A100
.space-letter
  padding-right: 0.3em
.nowrap
  white-space: nowrap
a.accent:hover
  color: $cc-A400
a.btn:hover
  background-color: $c-50
  color: $cc-A200
.shadow
  box-shadow: 0 0 10px rgba(0,0,0,0.2)
.primary
  color: $primary-text
.secondary
  color: $secondary-text
</style>
