<template>
<div class='find-place'>
  <form v-on:submit.prevent="onSubmit" class='search-box'>
      <input class='query-input' v-model='enteredInput' type='text' placeholder='Enter city name to start' ref='input'>
      <a type='submit' class='search-submit' href='#' @click.prevent='onSubmit' v-if='enteredInput'>Find Places</a>
  </form>
  <div class='results' v-if='!loading'>
    <div v-if='suggestionsLoaded && data.length' class='suggestions'>
      <div class='prompt message'>
        <div>Select a place below to download all roads within</div>
        <div class='note'>large areas may require 200MB+ of data transfer and powerful device</div>
      </div>
      <ul>
        <li v-for='(suggestion, index) in data' :key="index">
          <a @click.prevent='pickSuggestion(suggestion)' class='suggestion'
          href='#'>
          <span>
          {{suggestion.name}} <small>({{suggestion.type}})</small>
          </span>
          </a>
        </li>
      </ul>
    </div>
    <div v-if='suggestionsLoaded && !data.length && !loading' class='no-results message'>
      Didn't find matching a place. Try a different query?
    </div>
  </div>
  <div v-if='error' class='error message'>
    <div>Something went wrong. The error was:</div>
    <pre>{{error}}</pre>
  </div>
  <div v-if='loading' class='loading message'>
    <loading-icon></loading-icon>
  <span>{{loading}}</span>
    <div class='load-padding' v-if='stillLoading > 0'>
      Still loading...
    </div>
    <div class='load-padding' v-if='stillLoading > 1'>
      Sorry it takes so long!
    </div>
  </div>
</div>
</template>

<script>
import LoadingIcon from './LoadingIcon';
import postData from '../lib/postData';
import request from '../lib/request';
import appState from '../lib/appState';
import queryState from '../lib/appState';
import config from '../config';

export default {
  name: 'FindPlace',
  components: {
    LoadingIcon
  },
  data () {
    return {
      enteredInput: appState.get('q') || '',
      loading: null,
      lastCancel: null,
      suggestionsLoaded: false,
      stillLoading: 0,
      error: null,
      data: []
    }
  },
  beforeDestroy() {
    if (this.lastCancel) this.lastCancel();
    clearInterval(this.notifyStillLoading);
  },
  methods: {
    onSubmit() {
      queryState.set('q', this.enteredInput);
      const query = encodeURIComponent(this.enteredInput);
      this.error = false;
      this.loading = 'Searching places that match your query...'
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
      this.stillLoading = 0;
      clearInterval(this.notifyStillLoading);
      if (status.loaded < 0) {
        this.loading = 'Trying a different server'
        this.restartLoadingMonitor();
        return;
      }
      this.loading = 'Loaded ' + formatNumber(status.loaded) + ' bytes...';
    },

    pickSuggestion(suggestion) {
      if (this.lastCancel) {
        this.lastCancel();
        this.lastCancel = null;
      }
      this.checkCache(suggestion)
        .catch(error => {
          // No Cache - fallback
          this.useOSM(suggestion);
        });

      this.error = false;
    },

    restartLoadingMonitor() {
      clearInterval(this.notifyStillLoading);
      this.stillLoading = 0;
      this.notifyStillLoading = setInterval(() => {
        this.stillLoading++;
      }, 10000);
    },

    checkCache(suggestion) {
      this.loading = 'Checking cache...'
      let areaId = suggestion.areaId;
      return request(config.areaServer + '/' + areaId + '.pbf', {
        progress: this.updateProgress,
        responseType: 'arraybuffer'
      }).then(arrayBuffer => {
        var byteArray = new Uint8Array(arrayBuffer);
        console.log(byteArray.length);

        var Pbf = require('pbf');
        var place = require('../proto/place.js').place;
        var pbf = new Pbf(byteArray);
        var obj = place.read(pbf);
        console.log(obj);
        throw 'No way!'
      })
    },

    useOSM(suggestion) {
      this.loading = 'Connecting to OpenStreetMaps...'
      let queryPromise = postData(getQuery(suggestion.areaId), this.updateProgress);
      this.lastCancel = queryPromise.cancel;

      // it may take a while to load data. 
      this.restartLoadingMonitor();

      queryPromise.then(grid => {
        if (queryPromise.isCancelled) return;

        this.loading = null;
        grid.areaId = suggestion.areaId
        this.$emit('loaded', suggestion.name, grid);
      })
      .catch(err => {
        console.error(err);
        this.error = err;
        this.loading = null;
        this.data = [];
      })
      .finally(() => {
        clearInterval(this.notifyStillLoading);
        this.stillLoading = 0;
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
  color: #434343;
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
  color: highlight-color
  &:hover, &:focus {
    color: emphasis-background;
    background: highlight-color;
  }
}

.suggestion {
  display: block
  min-height: 64px
  align-items: center;
  border-bottom: 1px solid border-color
  display: flex
  padding: 0 10px;
  text-decoration: none
  color: highlight-color
}

.suggestions {
  position: relative;
  width: desktop-controls-width;
  background: white
  box-shadow: 0 2px 4px rgba(0,0,0,0.2)
  .note {
    font-size: 10px;
    font-style: italic;
  }
  .prompt {
    padding: 4px;
    text-align: center;
  }

  ul {
    list-style-type: none
    margin: 0
    padding: 0
  }
}

.error.message, 
.no-results.message, 
.loading {
  padding: 4px 8px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2)
}

.error {
  width: desktop-controls-width;
  overflow-x: auto;
}

.find-place {
  display: flex;
  flex-direction: column;
}
.load-padding {
  padding-left: 16px;
}
@media (max-width: small-screen) {
  .message {
    font-size: 12px;
  }
  .prompt {
    font-size: 12px;
    .note {
      font-size: 9px;
    }
  }
}

</style>
