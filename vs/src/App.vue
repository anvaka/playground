<template>
  <div id="app">
    <form v-on:submit.prevent="onSubmit" class='search-box'>
      <input class='search-input' type="text" v-model='appState.query' placeholder='Enter query' autofocus>
      <a type='submit' class='search-submit' href='#' @click.prevent='onSubmit' v-if='appState.query'>Go</a>
    </form>
    <div class='help'>Make a graph of Google's autocomplete
      for pattern: <span class='special'>{{appState.query || '[your query]'}} vs ...</span> </div>
    <div class='about-line'>
      <a class='about-link' href='#' @click.prevent='aboutVisible = true'>about</a>
      <a class='bold' href='http://github.com/anvaka/vs'>source code</a>
    </div>

    <about v-if='aboutVisible' @close='aboutVisible = false'></about>

  </div>
</template>

<script>
import appState, {performSearch} from './appState.js';
import createRenderer from './lib/createRenderer';
import About from './components/About';


export default {
  name: 'App',
  data() {
    return {
      aboutVisible: false,
      appState
    };
  },
  components: {
    About
  },
  methods: {
    onSubmit() {
      if (!appState.query) return;

      performSearch(appState.query)
      this.renderer.render(appState.graph);
    }
  },
  mounted() {
    this.renderer = createRenderer();
    if (appState.graph) {
      this.renderer.render(appState.graph);
    }
  }
}
</script>

<style lang='stylus'>
highlight-color = #ff4081;
secondary-color = rgba(0,0,0,.54);
background-color = white;

#app {
  position: relative;
  margin: 8px 14px;
  width: 392px;
  background: background-color;
}
.highlight {
  color: highlight-color;
}

.help {
  font-size: 12px;
  margin-top: 8px;
}
.search-submit {
  align-items: center;
  text-decoration: none;
  display: flex;
  width: 48px;
  justify-content: center;
}
.special {
  color: highlight-color;
  font-family: monospace;
}
a {
  text-decoration: none;
}

.about-line {
  position: fixed;
  right: 8px;
  top: 8px;
  padding: 7px 12px;
  a {
    background: background-color;
    display: block;
    text-align: right;
    font-size: 12px;
    color: secondary-color;
    &:hover, &:focus {
      color: highlight-color;
    }
  }
}
a.about-link {
}


.search-box {
  box-shadow: 0 2px 4px rgba(0,0,0,0.2), 0 -1px 0px rgba(0,0,0,0.02);
  height: 48px;
  display: flex;

  a {
    color: #B2B2B2
  }

  input.search-input {
    flex: 1;
    border: none;
    font-size: 24px;
    margin: 0 18px;

    &:focus {
      outline: none;
    }
  }
}

@media (max-width: 800px) {
  #app {
    width: 100%;
    margin: 0;
  }
  .help {
    padding: 0 8px;
  }
  .about-line {
    bottom: 18px;
    top: initial;
    right: 0;
  }
}
</style>
