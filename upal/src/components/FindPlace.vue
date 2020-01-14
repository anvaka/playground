<template>
<div>
  <form v-on:submit.prevent="onSubmit" class='search-box'>
      <input class='query-input' v-model='enteredInput' type='text' placeholder='Enter city name' ref='input'>
      <a type='submit' class='search-submit' href='#' @click.prevent='onSubmit' v-if='enteredInput'>Find Places</a>
  </form>
  <ul v-if='suggestionsLoaded && data.length && !loading' class='suggestions'>
    <li v-for='(suggestion, index) in data' :key="index">
      <a @click.prevent='pickSuggestion(suggestion)' class='suggestion'
       href='#'>
      <span>
      {{suggestion.name}} <small>({{suggestion.type}})</small>
      </span>
      </a>
    </li>
  </ul>
  <div v-if='loading' class='loading'>
    {{loading}}
  </div>
</div>
</template>

<script>
import postData from '../lib/postData';

export default {
  name: 'FindPlace',
  data () {
    return {
      enteredInput: '',
      loading: null,
      lastCancel: null,
      suggestionsLoaded: false,
      data: []
    }
  },
  beforeDestroy() {
    if (this.lastCancel) this.lastCancel();
  },
  methods: {
    onSubmit() {
      const query = encodeURIComponent(this.enteredInput);
      this.loading = 'Searching areas that match your query...'
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
        .then(x => x.json())
        .then(x => x.filter(row => row.osm_type === 'relation').map(row => ({
          name: row.display_name,
          type: row.type,
          areaId: row.osm_id + 36e8
        })))
        .then(data => {
          this.loading = null;
          this.suggestionsLoaded = true;
          this.data = data;
        });
    },

    updateProgress(status) {
      this.loading = 'Loaded ' + formatNumber(status.loaded) + ' bytes...';
    },

    pickSuggestion(suggestion) {
      if (this.lastCancel) {
        this.lastCancel();
        this.lastCancel = null;
      }

      this.loading = 'Connecting to OpenStreetMaps...'
      let queryPromise = postData(getQuery(suggestion.areaId), this.updateProgress);
      this.lastCancel = queryPromise.cancel;

      queryPromise.then(grid => {
          if (queryPromise.isCancelled) return;
          this.loading = null;
          this.$emit('loaded', suggestion.name, grid);
        });
    }
  }
}

function getQuery(areaId) {
    return `[timeout:9000][maxsize:2000000000][out:json];
area(${areaId});
(._; )->.area;
(
way["highway"](area.area);
node(w);
);
out skel;`;
}

function formatNumber(x) {
  if (!Number.isFinite(x)) return 'N/A';
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
</script>

<style lang="stylus">
@import('../vars.styl');


input {
  border: none;
  flex: 1;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  padding: 0;
  color: highlight-color;
  height: 100%;
  font-size: 16px;
  &:focus {
    outline: none;
  }
}

.search-box {
  position: relative;
  background-color: emphasis-background;
  padding: 0 8px;
  width: desktop-controls-width;
  padding: 0 0 0 8px;

  box-shadow: 0 2px 4px rgba(0,0,0,0.2), 0 -1px 0px rgba(0,0,0,0.02);
  height: 48px;
  display: flex;
  font-size: 16px;
  cursor: text;
  a {
    cursor: pointer;
  }
  span {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
}
.search-submit {
  padding: 0 8px;
  align-items: center;
  text-decoration: none;
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  outline: none;
  &:hover, &:focus {
    color: emphasis-background;
    background: highlight-color;
  }
}

.suggestion {
  display: block
  height: 64px
  align-items: center;
  border-bottom: 1px solid border-color
  display: flex
  padding-left: 10px
  text-decoration: none
  color: primary-text
}
.suggestion:hover,
.suggestion.selected
  color: highlight-color

.suggestions
  position: relative;
  width: desktop-controls-width;
  padding: 0
  background: white
  list-style-type: none
  margin: 0
  border-top: 1px solid border-color
  box-shadow: 0 2px 4px rgba(0,0,0,0.2)
</style>
