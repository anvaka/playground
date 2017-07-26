var BezierEasing = require('bezier-easing')

let easing =  BezierEasing(0.25, 0.1, 0.25, 1);

function edgeAnimator(animatedEdges) {
  var frame = 0;
  var durationInMs = 4000;
  var durationInFrames = Math.max(1, durationInMs * 0.06) // 0.06 because 60 frames pers 1,000 ms

  var previousAnimationId = requestAnimationFrame(loop);

  function loop() {
    var t = easing(frame/durationInFrames)
    frame += 1
    animatedEdges.forEach(e => e.step(t));

    if (frame <= durationInFrames) {
      previousAnimationId = requestAnimationFrame(loop)
    } else {
      previousAnimationId = 0
    }
  }
}

module.exports = edgeAnimator;