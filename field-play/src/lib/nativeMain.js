import initScene from './scene';

var canvas = document.getElementById('scene');
canvas.width = window.innerWidth;
canvas.height =  window.innerHeight;

var ctxOptions = {antialiasing: false};
var gl = canvas.getContext('webgl', ctxOptions) ||
         canvas.getContext('experimental-webgl', ctxOptions);
var scene = initScene(gl);
scene.start();
// TODO: too bad?
window.scene = scene;

require.ensure('@/main.js', () => {
  require('@/main.js');
})