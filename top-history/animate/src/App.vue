<template>
  <div id="app">
    <Relist :predictor='predictor'/>
  </div>
</template>

<script>
import Relist from './components/Relist';
import echarts from 'echarts';

export default {
  name: 'App',

  components: {
    Relist
  },

  data() {
    return {
      predictor: window.predictor
    }
  },
  mounted() {
  }
}

</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
