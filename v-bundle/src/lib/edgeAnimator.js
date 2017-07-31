var BezierEasing = require('bezier-easing')

let easing =  BezierEasing(0.25, 0.1, 0.25, 1);

function edgeAnimator(animatedEdges) {
  var frame = 0;
  var durationInMs = 4000;
  var durationInFrames = Math.max(1, durationInMs * 0.06) // 0.06 because 60 frames pers 1,000 ms

  requestAnimationFrame(loop);
  let phase = 'expand';

  function loop() {
    var t = easing(frame/durationInFrames)

    if (phase === 'expand') {
      frame += 1
      if (frame > durationInFrames) {
        phase = 'collapse'
        setTimeout(() => requestAnimationFrame(loop), 1000);
      } else {
        requestAnimationFrame(loop)
      }
    } else if (phase === 'collapse') {
      frame -= 1
      if (frame >= 0) {
        requestAnimationFrame(loop)
      }
    }

    animatedEdges.forEach(e => e.step(t));
  }
}

module.exports = edgeAnimator;