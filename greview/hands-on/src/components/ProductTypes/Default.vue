<template>
<div>
  <h3 class='product-title'>{{product.title}} <small class='secondary nowrap' v-if='published'>{{published}}</small></h3>
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
    attributes() {
      let result = []
      let attr = this.product.attributes

      if (!attr) return result

      if (this.product.salesRank) {
        result.push({
          name: 'Sales Rank',
          value: format(this.product.salesRank)
        })
      }

      if (attr.Studio) {
        result.push({
          name: 'Publisher',
          value: attr.Studio
        })
      }

      return result
    },

    published() {
      let attr = this.product && this.product.attributes
      if (!attr) return

      return attr.ReleaseDate || attr.PublicationDate
    }
  }
}
</script>
