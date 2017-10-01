<template>
  <div id="app">
  <svg>
    <defs>
    <marker id='head' orient='auto' markerWidth='2' markerHeight='3'
            refX='0.1' refY='1.5'>
      <path d='M0,0 V3 L1.5,1.5 Z' fill='red' />
    </marker>
  </defs> 
    <g ref='scene'>
      <g transform='matrix(3 0 0 3 300 400)'>
        <path :d='arrows' stroke-width='1' stroke='#224A46' fill='transparent'></path>
        <path v-for='traceLine in traces' :d='traceLine' stroke-width='0.5' stroke='#8CF9F6' fill='transparent'></path>
      </g>
    </g>
  </svg>
  </div>
</template>

<script>
import panzoom from 'panzoom';
import Vector from './lib/Vector';
import {getFieldPath, traceLine} from './lib/scene';
import DE from './lib/designElements';

export default {
  name: 'app',
  mounted() {
    this.zoomer = panzoom(this.$refs.scene)
    var self = this;
    var radial = DE.createRadialTensor(0, 0);
    var radialDx = DE.createRadialTensor(5, -5);
    var gridDx = DE.createGridTensor(0, 0, -Math.PI/3);
    var composition = [radial, radialDx]//, gridDx];
    // var composition = [];
    // DE.appendPolyLineTensor(composition, [{x: -5, y: 0}, {x: 0, y: -2}, {x: 3, y: -10}]);
    var composite = DE.createCompositeTensor(composition, 0.95);

    var sceneField = DE.explicit();
    var vectorField = sceneField.getEigenVector(); 
    this.traces.push(traceLine(sceneField, new Vector(-7.45, 0.0)));
    this.arrows = getFieldPath(vectorField);
  },

  data() {
    return {
      arrows: '',
      traces: []
    };
  },

  beforeDestroy() {
    this.zoomer.dispose();
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;

}
body {
  background-color: #0E2324;
}
svg {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
