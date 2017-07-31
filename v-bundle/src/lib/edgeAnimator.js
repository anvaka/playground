var BezierEasing = require('bezier-easing')

let easing =  BezierEasing(0.25, 0.1, 0.25, 1);

function edgeAnimator(animatedEdges, ctx) {
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

    let canvas = ctx.canvas;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.strokeStyle = 'RGBA(184, 76, 40, 0.8)';
    animatedEdges.forEach(e => e.step(t));
  }
}

module.exports = edgeAnimator;