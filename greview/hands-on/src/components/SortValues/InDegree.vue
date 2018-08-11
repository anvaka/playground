<template>
<div>
<span class='accent'>{{value}}</span> <span class='secondary'> {{getPlural(value)}} point here</span>
</div>
</template>

<script>
export default {
  props: ['value'],
  methods: {
    getPlural(count) {
      if (count === 1) return 'product'
      return 'products'
    }
  }
}
</script>