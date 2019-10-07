<template>
  <div class='template-selector'>
    <div class='loading'>Loading top posts</div>
  </div>
</template>

<script>
import fetchPosts from '../lib/fetchPosts';

export default {
  name: 'PostSelector',
  props: ['subreddit'],
  data() {
    return {
      loading: true,
      posts: []
    }
  },
  mounted() {
    fetchPosts().then(posts => {
      this.posts = posts;
      this.$emit('loaded', posts);
    });
  }
}
</script>