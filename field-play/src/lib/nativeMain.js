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

window.saveVideo = saveVideo;

function saveVideo() {
  var recordedChunks = [];

  var options = {mimeType: 'video/webm;codecs=vp9'};
  var mediaRecorder = new MediaRecorder(canvas.captureStream(60), options);
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

  mediaRecorder.start();

  return stop;

  function stop() {
    mediaRecorder.stop();
  }

  function handleStop() {
    console.log('done');
    download();
  }


  function handleDataAvailable(event) {
    console.log('data');
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    } else {
      // ...
    }
  }
  function download() {
    var blob = new Blob(recordedChunks, {
      type: 'video/webm'
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = url;
    a.download = 'test.webm';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}