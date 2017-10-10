import initScene from './scene';

var canvas = document.getElementById('scene');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var gl = canvas.getContext('webgl', {antialiasing: false});
var scene = initScene(gl);
scene.start();
// TODO: too bad?
window.scene = scene;

require.ensure('@/main.js', () => {
  require('@/main.js');
})