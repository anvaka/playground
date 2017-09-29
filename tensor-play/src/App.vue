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
        <path id='path' stroke-width='1' stroke='black' fill='transparent' marker-end='url(#head)'></path>
      </g>
      <path transform='matrix(3 0 0 3 300 300)' id='sline' stroke-width='0.5' stroke='red' fill='transparent'></path>
    </g>
  </svg>
  </div>
</template>

<script>
import panzoom from 'panzoom';
import drawAll from './lib/scene';

export default {
  name: 'app',
  mounted() {
    this.zoomer = panzoom(this.$refs.scene)
    drawAll();
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
