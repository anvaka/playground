<template>
  <div>
    <div class='row'>
      <div class='label'>K1</div>
      <div class='value'><input v-model='settings.k1'></div>
    </div>
    <div class='row'>
      <div class='label'>K2</div>
      <div class='value'><input v-model='settings.k2'></div>
    </div>
    <div class='row'>
      <div class='label'>K3</div>
      <div class='value'><input v-model='settings.k3'></div>
    </div>
    <div class='row'>
      <div class='label'>Length</div>
      <div class='value'><input v-model='settings.edgeLength'></div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['settings']
}
</script>
