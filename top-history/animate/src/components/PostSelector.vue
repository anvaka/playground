<template>
  <div class='template-selector'>
    <div class='loading' v-if='loading && !error'>Loading top posts</div>
    <div v-if='!loading && !error' class='content-container'>
      <a class='button' href='#' v-if='canSelectPrev' @click.prevent='selectPrev'>Prev</a>
      <div class='post-info'>
        <h3><a target='_blank' :href='selected.permalink'>{{selected.title}}</a></h3>
        <div class='row'>
          <div class='label'>Posted: </div>
          <div class='value'>{{selected.createdStr}} ago</div>
        </div>
        <div class='row'>
          <div class='label'>Score: </div>
          <div class='value'>{{selected.scoreStr}}</div>
        </div>
      </div>
      <a class='button' href='#' v-if='canSelectNext' @click.prevent='selectNext'>Next</a>
    </div>
    <div v-if='error'>
      <h3>Oops</h3>
      <div>{{error}}</div>
    </div>
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
      index: 0,
      selected: undefined,
      canSelectNext: false,
      canSelectPrev: false,
      error: null,
      posts: []
    }
  },
  methods: {
    select(postIndex) {
      this.index = postIndex;
      this.selected = this.posts[postIndex];
      this.canSelectNext = postIndex < this.posts.length;
      this.canSelectPrev = postIndex > 0 ;

      this.$emit('selected', this.selected);
    },
    selectNext() {
      if (this.canSelectNext) this.select(this.index + 1);
    },

    selectPrev() {
      if (this.canSelectPrev) this.select(this.index - 1);
    }
  },
  mounted() {
    fetchPosts().then(posts => {
      this.posts = posts;
      this.select(0);
      this.loading = false;
      this.$emit('loaded', posts);
    }).catch(err => {
      this.error = 'Failed to load latest posts.'
      console.error(err);
    });
  }
}
</script>

<style>
.content-container {
  display: flex;
  flex-direction: row;
}

a.button, .button-spacer {
  width: 52px;
  display: flex;
  align-items: center;
}
.post-info {
  flex: 1;
  overflow:hidden;
}
.post-info h3 {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
  text-align: left;
}
.template-selector {
  max-width: 640px;
  margin: auto;
}
.row {
  display: flex;
  flex-direction: row;
}

.value {
  text-align: left;
}

</style>
