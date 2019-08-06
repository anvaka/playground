<template>
  <div class='formula-editor'>
  <div class='editor-row'>
    <a href="#" @click.prevent='showSettings' class='settings-trigger'>
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 1024 1024">
<path d="M512 64q26 0 54 4l16 46 10 31 32 9q32 10 62 26l29 15 29-15 43-21q44 34 78 77l-22 43-14 30 15 29q15 30 26 62l9 31 31 11 46 15q4 29 4 54v1q0 26-4 54l-46 16-31 10-10 32q-9 32-25 62l-16 29 15 29 22 43q-18 23-36 42h-1q-18 18-41 36l-43-22-29-15-29 16q-30 15-62 25l-32 10-10 31-15 46q-29 4-55 4t-55-4l-15-46-10-31-32-10q-33-10-62-25l-29-16-29 15-43 22q-23-18-42-36-18-19-36-42l22-43 15-29-16-29q-16-31-25-62l-10-32-31-10-46-15q-4-29-4-55t4-55l46-15 31-10 9-32q10-32 26-62l15-29-14-29-22-43q34-44 77-78l44 22 29 15 29-16q30-15 62-26l32-9 10-31 15-46q30-4 55-4zm0-64q-37 0-81 7l-22 4-28 83q-39 12-73 30l-78-39-18 13q-66 48-115 114l-13 18 40 78q-19 36-31 73l-83 28-3 22q-7 44-7 81t7 81l3 22 83 28q12 38 31 73l-39 78 13 18q24 34 52 62 26 26 62 52l18 13 78-39q36 19 73 30l28 84 22 3q44 7 81 7t81-7l22-3 27-84q38-11 74-30l78 39 18-13q35-26 62-52 27-27 52-62l13-18-39-79q18-35 30-73l83-27 4-22q7-44 7-81t-7-81l-4-22-83-28q-12-38-30-73l39-78-13-18q-49-67-115-115l-18-13-78 39q-35-18-73-30l-27-83-22-3q-44-7-81-7zm0 386q52 0 89 37t37 89-37 89-89 37-89-37-37-89 37-89 89-37zm0-64q-79 0-134.5 55.5T322 512t55.5 134.5T512 702t134.5-55.5T702 512t-55.5-134.5T512 322z"/>
</svg></a>
    <div class='formula math'>𝑓(x) = </div>
    <div class='input-container'>
      <div class='syntax math offset' v-html='codeHighlight' ref='syntax'></div>
      <input class='math offset' type="text" v-model='model.code' ref='editor' @keydown.capture="syncScroll" @keyup="syncScroll"> 
    </div>
  </div>
    <div class='error-container'>
      <pre v-if='model.error' class='error hl'>{{model.error}}</pre>
    </div> 
  </div>
</template>
<script>
export default {
  props: ['model'],
  computed: {
    codeHighlight() {
      const code = this.model.code;
      let rules = [{
        pattern: /[0-9]+(\.[0-9]+)?/g,
        className: 'number'
      }, {
        pattern: /[\(\)]/g,
        className: 'bracket'
      }]
      return rules.reduce(evaluateRule, code);
    }
  },
  methods: {
    syncScroll() {
      let {editor, syntax} = this.$refs;
      if (!editor || !syntax) return;

      syntax.scrollLeft = editor.scrollLeft;
    },
    showSettings() {
      this.$emit('toggle-settings')
    }
  },

  watch: {
    'model.code': function() {
      if (this.pendingSetCode) {
        clearTimeout(this.pendingSetCode);
      }
      this.syncScroll();

      // We don't want to update code on each key stroke. This would have negative
      // impact on performance.
      this.pendingSetCode = setTimeout(() => {
        this.model.setCode(this.model.code, true);
        this.pendingSetCode = 0;
      }, 300);
    },
  }
}
function evaluateRule(code, rule) {
  return code.replace(rule.pattern, match => `<span class=${rule.className}>${match}</span>`);
}

</script>

<style lang="stylus">

@import '../shared.styl';
.editor-row {
  border: 1px solid secondary-border;
  width: 100%;
  display: flex;
  color: white;
  background-color: #061838;
  font-size: 18px;
  height: 48px;
  align-items: center;

  .formula {
    left: 68px;
    position: absolute;
    pointer-events: none;
  }

.settings-trigger {
  margin-left: 19px;
  margin-right: 27px;
  display: flex;
  svg {
    width: 24px;
    height 24px;
    fill: secondary-border;
  }
  &:hover {
    svg {
      fill: white;
    }
  }
}

.math {
  font-family: MJXc-TeX-math-I,MJXc-TeX-math-Ix,MJXc-TeX-math-Iw;
}
  .input-container {
    flex: 1;
    align-self: stretch;
    position: relative;
    font-size: 18px;
    .syntax {
      padding-left: 52px;
      white-space:pre;
      overflow: hidden;
      display: flex;
      align-items: center;
      .number {
        color: #f99157;
      }
      .bracket {
        color: gray;
      }
    }
  }

  .offset {
    top: 0;
    left: 0px;
    width: 100%;
    height: 100%;
    position: absolute;
  }

  input {
    font-family: MJXc-TeX-math-I,MJXc-TeX-math-Ix,MJXc-TeX-math-Iw;
    font-size: 18px;
    caret-color: primary-text;
    background: transparent;
    color: transparent;
    border: 1px solid transparent;
    padding-left: 51px;

    &:focus {
      outline-offset: 0;
      outline: none;
      border: 1px dashed;
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
