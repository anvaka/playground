<template>
<div>
<span class='secondary'>{{name}}: </span><span class='accent'>{{value}}</span>
</div>
</template>

<script>
export default {
  props: ['value', 'name']
}
</script>