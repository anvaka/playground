<template>
  <div id="app">
    <h3>Today vs Past of <strong>/r/dataisbeautiful</strong></h3>
    <p class='info'>
      Compare today's <a href=''>/r/dataisbeautiful</a> posts
      with posts that had similar scores in the past.
    </p>
    <div v-if='loading'>Loading archive from the past...</div>
    <div v-if='!loading'>Loaded {{postCount}} posts</div>
  </div>
</template>

<script>
import Relist from './components/Relist';
import getArchive from './lib/getArchive'

export default {
  name: 'App',

  components: {
  },

  data() {
    return {
      loading: true,
      postCount: 0
    };
  },
  mounted() {
    getArchive().then((archive) => {
      this.loading = false;
      this.postCount = archive.postCount;
    })
  }
}

</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 8px;
}
h3 {
  font-weight: normal;
  font-size: 21px;
  margin: 0;
}
p.info {
  margin: 0;
  max-width: 450px;
  color: #333;
  font-size: 14px;

}
</style>
