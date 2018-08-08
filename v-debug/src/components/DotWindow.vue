<template>
<div class='window-container full absolute'>
  <div class='background full absolute' @click='close'></div>
  <div class='window-content absolute'>
    <div class='header'>
      <a href="#" @click.prevent='copy'>Copy to clibpard</a>
      <a href="#" @click.prevent='useIt'>Use this graph as baseline</a>
      <a href="#" @click.prevent='close'>Close</a>
    </div>
    <div class='content'>
        <textarea ref='dotContainer' v-model='ourContent' class='full absolute'></textarea>
    </div>
    <div class='footer'>
      <div class='error' v-if='error'>{{error}}</div>
    </div>
  </div>
</div>
</template>
<script>
import fromDot from 'ngraph.fromdot';
import fromJson from 'ngraph.fromjson';
import bus from '../lib/bus';

export default {
  props: ['content'],
  data() {
    return {
      error: '',
      ourContent: this.content
    }
  },
  methods: {
    close() {
      this.$emit('close')
    },
    copy() {
      let element = this.$refs.dotContainer;
      element.select();
      element.setSelectionRange(0, element.value.length);
      document.execCommand('copy');
    },
    useIt() {
      this.error = '';
      if (this.ourContent && this.ourContent[0] === '{') {
        tryLoadJson(this.ourContent, this);
      } else tryLoadDot(this.ourContent, this);
    }
  }
}

function tryLoadDot(content, self) {
  try {
    let graph = fromDot(self.ourContent);
    bus.fire('load-graph', graph);
    self.close();
  } catch (e) {
    self.error = e.message;
  }
}

function tryLoadJson(content, self) {
  try {
    let graph = fromJson(self.ourContent);
    bus.fire('load-graph', graph);
    self.close();
  } catch (e) {
    self.error = e.message;
  }
}
</script>

<style>
.absolute {
  position: absolute;
}

.error {
  color: red;
}

.full {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.window-container {
  display: flex;
  justify-content: center;
  overflow: auto;
}

.window-container .background {
  background: rgba(33, 33, 33, 0.2);
}

.window-content {
  padding: 15px;
}
.window-content .content {
  flex: 1;
  position: relative;
}

.window-content {
  display: flex;
  flex-direction: column;
  background: wheat;
  width: 400px;
  height: 300px;
  overflow: hidden;
}
</style>
