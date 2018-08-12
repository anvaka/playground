<template>
<div>
  <component :is='currentView' :product='product'></component>

  <div class='item-nodes'>
    <a :href='getTagLink(tag)' v-for='(tag, index) in product.browseNodes' target='_blank'
       :key='index'
       title='Open on Amazon'>{{tag.name}}</a>
  </div>
  <div v-for='(description, index) in descriptions' :key='index'>
    <h5>{{description.title}}</h5>
    <p v-html='description.content'></p>
  </div>
</div>
</template>

<style lang='stylus'>
@import './variables.styl'

.attr-name,
.price-label
  color: $secondary-text

.item-nodes
  margin-top: 7px
  a
    color: $secondary-text
    display: inline-block
    margin-right: 7px
    margin-bottom: 7px
    padding: 4px
    border: 1px dashed $cc-A400
    &:hover
      background-color: $cc-A200
      color: white

</style>

<script>
import Default from './ProductTypes/Default.vue'
import Book from './ProductTypes/Book.vue'
import Movie from './ProductTypes/Movie.vue'
import Game from './ProductTypes/Game.vue'

export default {
  props: ['product'],
  computed: {
    currentView() {
      let product = this.product
      let productGroup = product && product.attributes && product.attributes.ProductGroup
      return getViewNameByProduct(productGroup)
    },
    descriptions() {
      return this.product.descriptions || []
    }
  },
  components: {
    Default,
    Book,
    Movie,
    Game
  },
  methods: {
    getTagLink(tag) {
      return 'http://www.amazon.com/b/?node=' + tag.id + '&tag=wwwyasivcom-20'
    }
  }
}
function getViewNameByProduct(productGroup) {
  if (productGroup === 'Book' || productGroup === 'eBooks') {
    return 'book'
  }
  if (productGroup === 'Movie') {
    return 'movie'
  }
  if (productGroup === 'Video Games' ||
    productGroup === 'Digital Video Games' ||
    productGroup === 'Software') {
    return 'game'
  }

  return 'default'
}
</script>
