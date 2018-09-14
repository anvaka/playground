import findIntersections from './findIntersections';

export default createScene;
let wgl = require('w-gl');

function createScene(lines, canvas) {
  var scene = wgl.scene(canvas);
  var initialSceneSize = 10;
  scene.setViewBox({
    left:  -initialSceneSize,
    top:   -initialSceneSize,
    right:  initialSceneSize,
    bottom: initialSceneSize,
  })

  var guidelines = new wgl.WireCollection(lines.length);
  guidelines.color = {r: 0.1, g: 0.4, b: 0.8, a: 0.9};

  ([
    {start: {x: -100, y: 0}, end: {x: 100, y: 0}},
    {start: {x: 0, y: -100}, end: {x: 0, y: 100}},
  ]).forEach(function (line) {
    guidelines.add({ from: line.start, to: line.end });
  });

  scene.appendChild(guidelines);

  var linesEl = new wgl.WireCollection(lines.length);
  // linesEl.color = {r: 0.8, g: 0.8, b: 0.8, a: 0.7}
  // linesEl.color = {r: 0.1, g: 0.1, b: 0.1, a: 0.9}
  lines.forEach(function (line) {
    linesEl.add({ from: line.start, to: line.end });
  });

  scene.appendChild(linesEl);
  var isAsync = 0;
  var next;
  var options = isAsync ? {
    control: {
      done(intersections) {
        drawIntersections(intersections);
      },
      step(sweepStatus, eventQueue, results) {
        drawSweepStatus(sweepStatus);
        console.log('Event queue size: ', eventQueue.size())
      }
    }
  } : {};

  var status = {};
  console.time('run')
  var intersections = findIntersections(lines, options);
  console.timeEnd('run')
  // eslint-disable-next-line
  if (isAsync) {
    var idx = 0;

    next = () => {
      console.log('next ', idx);
      if (idx === 121) debugger;
      intersections.next();
      idx += 1;
    }
    window.next = next;
  } else {
    console.log('found ' + intersections.length + ' intersections');
    drawIntersections(intersections);
  }

  function drawSweepStatus(sweepStatus) {
    var pt = sweepStatus.getLastPoint();
    if (status.point) {
      scene.removeChild(status.point);
    }

    status.point = new wgl.PointCollection(1);
    var ui = status.point.add(pt);
    ui.setColor({r: 1, g: 0, b: 0});
    scene.appendChild(status.point);

    // status line
    if (status.line) {
      scene.removeChild(status.line);
    }
    status.line = new wgl.WireCollection(1);
    status.line.color = {r: 0.1, g: 1.0, b: 1.0, a: 0.9};
    status.line.add({ from: {
      x: -100, y: pt.y
    }, to: {x: 100, y: pt.y} });
    scene.appendChild(status.line);

    // lines
    if (status.segments) {
      scene.removeChild(status.segments);
    }
    var segments = sweepStatus.status.keys();
    status.segments = new wgl.WireCollection(segments.length);
    status.segments.color = {r: 0.1, g: 1.0, b: 0.0, a: 0.9};
    segments.forEach(s => {
      status.segments.add({ from: s.segment.start, to: s.segment.end });
    })

    scene.appendChild(status.segments);
  }

  function drawIntersections(intersections) {
    let nodes = new wgl.PointCollection(intersections.length);
    intersections.forEach((intersect, id) => {
      var ui = nodes.add(intersect.point, id);
      ui.setColor({r: 1, g: 25/255, b: 24/255})
    })
    scene.appendChild(nodes);
  }
}