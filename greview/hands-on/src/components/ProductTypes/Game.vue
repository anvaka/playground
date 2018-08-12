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

      if (this.product.salesRank) {
        result.push({
          name: 'Sales Rank',
          value: format(this.product.salesRank)
        })
      }

      if (attr.Genre) {
        result.push({
          name: 'Genre',
          value: getGenre(attr.Genre)
        })
      }

      if (attr.Platform) {
        result.push({
          name: 'Platform',
          value: getPlatform(attr.Platform)
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
  }
}

const genres = {
  'action-game-genre': 'Action',
  'action_games': 'Action',
  'action-games': 'Action',
  'adventure-game-genre': 'Adventure',
  'adventure_games': 'Adventure',
  'arcade-game-genre': 'Arcade',
  'fighting-action-game-genre': 'Fighting',
  'racing-game-genre': 'Racing',
  'role-playing-game-genre': 'RPG',
  'role_playing_games': 'RPG',
  'seek_and_find_games': 'Seek & Find',
  'shooter-action-game-genre': 'Shooter',
  'shooter_action_games': 'Shooter',
  'simulation_games': 'Simulation',
  'skateboarding-game-genre': 'Skateboarding',
  'sports_games': 'Sports'
}

function getGenre(src) {
  return genres[src] || src
}

function getPlatform(src) {
  if (!Array.isArray(src)) return src

  return src.join(', ')
}
</script>
