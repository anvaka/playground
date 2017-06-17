<template>
  <div id="app">
    <h4>{{progress}}</h4>
    <picture-input
       v-if='!showResults'
      ref="pictureInput"
      @change="onChange"
      width="600"
      height="600"
      margin="16"
      accept="image/jpeg,image/png"
      size="10"
      buttonClass="btn"
      :customStrings="{
        upload: '<h1>Bummer!</h1>',
        drag: 'Open an image'
      }">
    </picture-input>
    <div v-model='text' v-if='showResults' v-html='text'></div>
  </div>
</template>

<script>
// import Tesseract from 'tesseract.js'
import PictureInput from 'vue-picture-input'

export default {
  name: 'app',
  components: {
    PictureInput
  },
  data() {
    return {
      showResults: false,
      progress: '',
      text: ''
    };
  },
  methods: {
    onChange () {
      console.log('New picture selected!')
      let context = this.$refs.pictureInput.context;
      if (context) {
        console.log('Picture loaded.')
        setTimeout(() => {
          Tesseract.recognize(context)
            .progress((message) => {
              this.progress = message.status + ' - ' + Math.round(message.progress * 100) + '%';
            })
            .then((result) => {
              this.showResults = true;
              this.text = result.html;
              console.log(result)
          })
        }, 500);
      } else {
        console.log('FileReader API not supported: use the <form>, Luke!')
      }
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
