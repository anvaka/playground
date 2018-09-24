<template>
  <div id="app">
    <h3><strong>isect</strong> - intersection detection library</h3>
    <div>
      <a href='#' @click.prevent='generateNew()' class='action'>Generate New Demo</a>
    </div>
    <div v-if='showMetrics' class='results'>
      <div><strong>{{linesCount}}</strong> lines. Found <strong>{{found}}</strong> intersections in <strong>{{elapsed}}</strong></div>
    </div>
    <div class='error' v-if='error'>
      Rounding error detected.
    </div>
    <a href='https://github.com/anvaka/isect' class='info'>Source code</a>
  </div>
</template>

<script>
import appState from './appStatus.js';
import generateRandomExample from './generateRandomExample';
import bus from './bus';

export default {
  name: 'app',
  props: ['state'],
  data() {
    return appState;
  },
  methods: {
    generateNew() {
      var newState = generateRandomExample();
      bus.fire('change-qs', newState);
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 400px;
  position: absolute;
  color: white;
  padding: 8px;
  background: #101830;
}
a.action {
  color: #fff;
  font-size: 16px;
  padding: 8px;
  flex: 1;
  border: 1px solid #99c5f1;
  justify-content: center;
  align-items: center;
  display: flex;
}
h3 {
  margin: 7px 0;
  font-weight: normal;
}
h3 strong {
  font-weight: bold;
}
a {
  text-decoration: none;
}
.results {
  margin-top: 7px;
}
.error {
  background: orangered;
  margin: 0 -8px;
  padding: 0 8px;
}

.info {
  position: fixed;
  right: 8px;
  top: 8px;
  color: white;
  border-bottom: 1px dashed;
}

@media (max-width: 600px) {
  #app {
    width: 100%;
    margin: 0px;
    padding: 0px;
  }
  .results {
    font-size: 12px;
    margin: 7px;
  }
  h3 {
    margin: 7px;
  }
  .error {
    padding: 0 7px;
    margin: 0;
  }

  .info {
    bottom: 42px;
    left: 8px;
    right: inherit;
    top: inherit;
  }
}
</style>
