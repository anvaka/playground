<template>
  <div class='formula-editor'>
  <div class='editor-row'>
    <div class='formula'><vue-mathjax formula='$$f(x) = $$'></vue-mathjax></div>
    <input type="text" v-model='model.code' ref='editor'> 
  </div>
    <div class='error-container'>
      <pre v-if='model.error' class='error hl'>{{model.error}}</pre>
    </div> 
  </div>
</template>
<script>
export default {
  props: ['model'],

  watch: {
    'model.code': function() {
      if (this.pendingSetCode) {
        clearTimeout(this.pendingSetCode);
      }

      // We don't want to update code on each key stroke. This would have negative
      // impact on performance.
      this.pendingSetCode = setTimeout(() => {
        this.model.setCode(this.model.code, true);
        this.pendingSetCode = 0;
      }, 300);
    },
  }
}
</script>

<style lang="stylus">

@import '../shared.styl';
.editor-row {
  width: 100%;
  display: flex;
  flex-direction: row;
  color: white;
  font-size: 18px;
  height: 48px;
  align-items: center;
  .formula {
    padding: 0 0 0 8px;
    pointer-events: none;
  }
  input {
    align-self: stretch;
    font-family: MJXc-TeX-math-I,MJXc-TeX-math-Ix,MJXc-TeX-math-Iw;
    flex: 1;
    font-size: 18px;
    background: transparent;
    color: primary-text;
    border: 1px solid transparent;
    padding: 0 8px;

    &:focus {
      outline-offset: 0;
      outline: none;
      border: 1px dashed;
      background: #13294f;
    }
    &:invalid {
      box-shadow:none;
    }
  }
}
  .error {
    white-space: normal;
  }
</style>
