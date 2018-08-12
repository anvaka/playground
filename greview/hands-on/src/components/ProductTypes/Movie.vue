<template>
<div>
  <div class='row wrap'>
    <h3 class='product-title'>{{product.title}} <small class='secondary nowrap'>{{published}}</small></h3>
  </div>

  <div v-for='(attr, index) in attributes' class='row wrap' :key='index'>
    <div class='attr-name space-letter'>{{attr.name}}: </div>
    <div class='value'>{{attr.value}}</div>
  </div>
</div>
</template>

<script>
import format from '../../lib/formatNumber.js'

export default {
  props: ['product'],
  computed: {
    published() {
      return this.product.attributes.ReleaseDate
    },
    attributes() {
      let attr = this.product.attributes
      let result = []
      if (attr.Actor) {
        result.push({
          name: 'Starring',
          value: getActors(attr.Actor)
        })
      }

      if (this.product.salesRank) {
        result.push({
          name: 'Sales Rank',
          value: format(this.product.salesRank)
        })
      }

      if (attr.Genre) {
        result.push({
          name: 'Genre',
          value: attr.Genre
        })
      }
      if (attr.RunningTime) {
        result.push({
          name: 'Runtime',
          value: getRuntime(attr.RunningTime)
        })
      }
      if (attr.Director) {
        result.push({
          name: 'Director',
          value: attr.Director
        })
      }
      if (attr.Studio) {
        result.push({
          name: 'Publisher',
          value: attr.Studio
        })
      }

      return result
    }
  },
}

function getActors(actors) {
  if (!Array.isArray(actors)) return actors

  return actors.join(', ')
}
function getRuntime(time) {
  if (typeof time !== 'string') throw new Error('Time is not a string')
  let minutesNum = parseInt(time, 10)
  if (isNaN(minutesNum)) throw new Error('Time is not a number')

  let hours = Math.floor(minutesNum/60)
  let minutes = minutesNum % 60

  let hourStr = ''
  if (hours > 0) hourStr = hours + (hours === 1 ? ' hour, ' : ' hours, ')
  let minutesStr = minutes + (minutes === 1 ? ' minute' : ' minutes')
  return hourStr + minutesStr
}
</script>
