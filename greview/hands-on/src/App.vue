<template>
  <div id="app">

    <list-results :vm='listResults'></list-results>
  </div>
</template>

<script>
import appState from './appState.js';
import ListResults from './components/ListResults'

export default {
  name: 'app',
  components: {
    ListResults
  },

  data() {
    return appState
  }
}
</script>

<style lang="stylus">
@import './components/variables.styl'

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
