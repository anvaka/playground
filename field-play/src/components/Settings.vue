<template>
  <div class='settings'>
    <div>Vector field:</div>
    <textarea type='text' v-model='vectorField'>
    </textarea>
    <button @click.prevent='sendVectorField' value='send'>Draw</button>
    <div v-if='error' class='error'>{{error}}</div>
  </div>
</template>
<script>
export default {
  name: 'Settings',
  props: ['scene'],
  data() {
    return {
      error: '',
      vectorField: `v.x = -p.y;
v.y = p.x;
`
    };
  },
  methods: {
    sendVectorField() {
      let result = this.scene.updateVectorField(this.vectorField);
      if (result && result.error) {
        this.error = result.error
      } else {
        this.error = '';
      }
    }
  }
}
</script>

<style lang='stylus'>
.error {
  color: red;
  font-family: monospace;
}
.settings {
  color: white;
  position: absolute;
  top: 24px;
  left: 0px;
  background: black;
  width: 240px;
  border: 1px solid #336699;
}
</style>
