<template>
  <div id="app">
    <svg>
      <g>
        <path v-for='interval in intervals' :d='getLine(interval)'
          stroke='black'
          stroke-width='1px'>
        </path>
      </g>
    </svg>
  </div>
</template>

<script>
const rnd = require('ngraph.random').random(42)
const Point = require('./Point.js')

export default {
  name: 'app',
  data() {
    let intervals = []

    for (let i = 0; i < 10; ++i) {
      let start = new Point(rnd.next(640), rnd.next(480))
      let end = new Point(rnd.next(640), rnd.next(480))

      intervals.push({
        start, end
      })
    }

    return {
      intervals
    }
  },
  methods: {
    getLine(interval) {
      return `M${interval.start.toString()} L${interval.end.toString()}`
    }
  }
}
</script>

<style>
body, svg {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
}
</style>
