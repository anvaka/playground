<template>
<div>
  <div class='row wrap'>
    <h3 class='product-title'>{{product.title}} <small class='secondary nowrap'>{{published}}</small></h3>
  </div>
  <div class='authors row wrap'>
    <div v-for='(author, index) in authors' class='space-letter' :key='index'>
      <span>{{author.prefix}}</span>&nbsp;<span>{{author.name}}</span>
    </div>
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
    authors() {
      let attr = this.product.attributes
      let authors = attr.Author
      if (!authors) return []
      if (!Array.isArray(authors)) authors = [authors]

      return authors.map((name, idx) => {
        let prefix = (idx === 0) ? prefix = 'by' : 'and'

        return {
          prefix,
          name
        }
      })
    },
    published() {
      return this.product.attributes.PublicationDate
    },
    attributes() {
      let attr = this.product.attributes
      let result = []
      if (attr.NumberOfPages) {
        result.push({
          name: 'Pages',
          value: format(attr.NumberOfPages)
        })
      }

      result.push({
        name: 'Sales Rank',
        value: format(this.product.salesRank)
      })

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
</script>
