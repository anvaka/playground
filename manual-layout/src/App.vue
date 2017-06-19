<template>
  <div id="app">
    <svg>
      <g>
      <rect v-for='r in rects'
            @mousedown='onMouseDown($event, r)'
            :x='r.x' :y='r.y' :width='r.width' :height='r.height' :fill='getFill(r)' stroke='black'></rect>
      </g>
    </svg>
  </div>
</template>

<script>
const miserables = require('miserables')

export default {
  name: 'app',
  components: {
  },
  methods: {
    onRectClick (r) {
      this.rects.forEach(r => {
        r.highlighted = false
      })

      miserables.forEachLinkedNode(r.id, (other) => {
        this.idToRect.get(other.id).highlighted = true
      })
    },
    getFill (r) {
      if (r.highlighted) {
        return 'rgba(0, 255, 255, 0.2)'
      }
      return 'rgba(255, 255, 255, 0.2)'
    },
    onMouseDown (e, r) {
      e.preventDefault()

      this.onRectClick(r)

      let x = e.clientX
      let y = e.clientY

      window.addEventListener('mouseup', handleMouseUp, true)
      window.addEventListener('mousemove', handleMouseMove, true)

      function handleMouseUp (e) {
        debugger
        window.removeEventListener('mouseup', handleMouseUp, true)
        window.removeEventListener('mousemove', handleMouseMove, true)
      }

      function handleMouseMove (e) {
        r.y += e.clientY - y
        r.x += e.clientX - x

        x = e.clientX
        y = e.clientY
      }
    }
  },
  mounted () {
  },
  data () {
    const rects = []
    const width = 600
    const height = 600
    const idToRect = new Map()

    miserables.forEachNode(node => {
      const side = (5 + node.links.length * 2) + 'px'
      const r = {
        id: node.id,
        x: Math.random() * width,
        y: Math.random() * height,
        width: side,
        height: side,
        highlighted: false
      }
      rects.push(r)
      idToRect.set(r.id, r)
    })

    return {
      rects,
      idToRect
    }
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
  margin-top: 60px;
}
svg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
body {
  overflow: hidden;
  padding: 0;
  margin: 0;
}
</style>
