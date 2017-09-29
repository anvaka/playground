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
      <g transform='matrix(3 0 0 3 300 300)' id='points' >
        <path :d='arrows' stroke-width='1' stroke='black' fill='transparent'></path>
      </g>
      <path :d='traceLine' transform='matrix(3 0 0 3 300 300)' id='sline' stroke-width='0.5' stroke='red' fill='transparent'></path>
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

    var radial = DE.createRadialTensor(0, 0);
    var radiaDx = DE.createRadialTensor(-5, -5);
    var gridDx = DE.createGridTensor(5, -5, Math.PI);
    var composition = [radial, radiaDx, gridDx];
    // var composition = [];
    // DE.appendPolyLineTensor(composition, [{x: -5, y: 0}, {x: 0, y: -2}, {x: 3, y: -10}]);
    var composite = DE.createCompositeTensor(composition, 1);
    var vectorField = radial.getEigenVector(); 
    this.arrows = getFieldPath(vectorField);
    this.traceLine = traceLine(vectorField, new Vector(-1, -1));
  },

  data() {
    return {
      arrows: '',
      traceLine
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
svg {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
