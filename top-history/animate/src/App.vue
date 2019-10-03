<template>
  <div id="app">
    <h3>Today vs Past</h3>
    <div class='info' v-html="subtitle"></div>
    <div v-if='loading'>Loading archive from the past...</div>
    <div v-if='error'>
      <div class='error'>{{this.error}}</div>
      <div class='error'>Please <a href='https://twitter.com/anvaka' target='_blank'>ping anvaka@</a> to get this fixed</div>
    </div>
    <canvas ref='scene'></canvas>
  </div>
</template>

<script>
import Relist from './components/Relist';
import fetchArchive from './lib/fetchArchive';
import fetchPosts from './lib/fetchPosts';
import formatNumber from './lib/formatNumber';
import createSceneRenderer from './lib/createSceneRenderer';

export default {
  name: 'App',

  components: {
  },

  data() {
    return {
      loading: true,
      postCount: 0,
      error: null,
      subreddit: '/r/dataisbeautiful'
    };
  },
  computed: {
    subtitle() {
      const prefix = `Compare today's scores in <a href='https://www.reddit.com${this.subreddit}'>${this.subreddit}</a> with`;
      const suffix = ' posts that had similar scores in the past.';
      return prefix + (this.isLoading ? suffix : ' ' + formatNumber(this.postCount) + ' ' + suffix);
    }
  },

  methods: {
    ensurePostsAreRendered() {
      if (!this.sceneRenderer || !this.posts) {
        return;
      }
      this.sceneRenderer.renderPosts(this.posts);
    }
  },

  mounted() {
    fetchArchive().then((archive) => {
      this.loading = false;
      this.postCount = archive.postCount;
      this.sceneRenderer = createSceneRenderer(archive, this.$refs.scene)
      this.ensurePostsAreRendered();
    })
    .catch(e => {
      this.loading = false;
      this.error = 'Could not download archive. ' + e + '.';
      console.error('Could not download archive', e);
      debugger;
    });

    fetchPosts().then(posts => {
      this.posts = posts;
      this.ensurePostsAreRendered();
    })
  },

  beforeDestroy() {
    this.sceneRenderer.dispose();
  },
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 8px;
  text-align: center;
}
h3 {
  font-weight: normal;
  font-size: 21px;
  margin: 0;
}
.info {
  max-width: 640px;
  color: #333;
  font-size: 14px;
  margin: auto;

}
.error {
  font-family: monospace;
  color: orangered;
}
canvas {
  margin-top: 12px;
}
</style>
