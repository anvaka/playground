<template>
  <div id="app">
    <find-place v-if='!placeFound' @loaded='onGridLoaded'></find-place>
    <div v-if='placeFound'>
      <h3 @click.prevent='startOver'>{{name}}</h3>
    </div>
  </div>
</template>

<script>
import FindPlace from './components/FindPlace';
import createScene from './lib/createScene';
import {geoMercator} from 'd3-geo';

export default {
  name: 'App',
  components: {
    FindPlace
  },
  data() {
    return {
      placeFound: false,
      name: '',
    }
  },
  beforeDestroy() {
    this.dispose();
  },
  mounted() {
  },
  methods: {
    dispose() {
      if (this.scene) {
        this.scene.dispose();
      }
    },
    onGridLoaded(name, grid) {
      this.placeFound = true;
      this.name = name;
      let graph = require('ngraph.graph')();
      let minLat = Infinity;
      let maxLat = -Infinity;
      let minLon = Infinity;
      let maxLon = -Infinity;

      // TODO: async
      grid.elements.forEach(element => {
        if (element.type === 'node') {
          graph.addNode(element.id, {
            lon: element.lon,
            lat: element.lat,
          });
          if (element.lon < minLon) minLon = element.lon;
          if (element.lon > maxLon) maxLon = element.lon;
          if (element.lat < minLat) minLat = element.lat;
          if (element.lat > maxLat) maxLat = element.lat;
        } else if (element.type === 'way') {
          for (let index = 1; index < element.nodes.length; ++index) {
            let from = element.nodes[index - 1];
            let to = element.nodes[index];
            graph.addLink(from, to);
          }
        }
      });
      console.log(graph.getNodesCount(), graph.getLinksCount())

      var projector = geoMercator()
        .center([(minLon + maxLon) / 2, [minLat + maxLat]/2])
        .scale(6371393); // Radius of Earth

      this.scene = createScene(graph, document.querySelector('#canvas'), projector);
    },

    startOver() {
      this.dispose();
      this.placeFound = false;
    }
  }
}
</script>

<style lang='stylus'>
#app {
  margin: 8px;
  position: absolute;
  h3 {
    font-weight: normal;
  }
}

</style>
