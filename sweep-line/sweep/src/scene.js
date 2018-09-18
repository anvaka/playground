import findIntersections from './findIntersections';

export default createScene;
let wgl = require('w-gl');

function createScene(options, canvas) {
  var lines = options.lines;
  var isAsync = options.isAsync;
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
    {from: {x: -100, y: 0}, to: {x: 100, y: 0}},
    {from: {x: 0, y: -100}, to: {x: 0, y: 100}},
  ]).forEach(function (line) {
    guidelines.add({ from: line.from, to: line.to });
  });

  scene.appendChild(guidelines);

  var linesEl = new wgl.WireCollection(lines.length);
  lines.forEach(function (line) {
    linesEl.add({ from: line.from, to: line.to });
  });

  scene.appendChild(linesEl);
  var nodeCollection;
  var next;
  var doneCalled = false;
  var findOptions = isAsync ? {
    control: {
      done(intersections) {
        doneCalled = true;
        drawIntersections(intersections);
      },
      step(sweepStatus, results) {
        drawSweepStatus(sweepStatus);
        drawIntersections(results)
      }
    },
    debug: true
  } : {
    debug: true
  };

  findOptions.ignoreEndpoints = false;

  var status = {};

  // eslint-disable-next-line
  console.time('run')
  var intersections = findIntersections(lines, findOptions);
  // eslint-disable-next-line
  console.timeEnd('run')
  var nextFrame;
  if (isAsync) {
    next = () => {
      if (doneCalled) return;
      // console.log('next ', idx);
      intersections.next();
    }
    window.next = next;
    nextFrame = requestAnimationFrame(frame);
  } else {
    // eslint-disable-next-line
    console.log('found ' + intersections.length + ' intersections');
    drawIntersections(intersections);
  }

  return {
    dispose
  }

  function dispose() {
    if (nextFrame) {
      cancelAnimationFrame(nextFrame);
      nextFrame = 0;
    }
    scene.dispose();
  }

  function frame() {
    for (var i = 0; i < 20; ++i) {
      next();
    }
    nextFrame = requestAnimationFrame(frame);
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
      x: -1000, y: pt.y
    }, to: {x: 1000, y: pt.y} });
    scene.appendChild(status.line);

    // lines
    if (status.segments) {
      scene.removeChild(status.segments);
    }
    var segments = sweepStatus.status.keys();
    status.segments = new wgl.WireCollection(segments.length);
    status.segments.color = {r: 0.1, g: 1.0, b: 0.0, a: 0.9};
    segments.forEach(s => {
      status.segments.add({ from: s.from, to: s.to });
    })

    scene.appendChild(status.segments);
  }

  function drawIntersections(intersections) {
    if (nodeCollection) {
      scene.removeChild(nodeCollection)
      nodeCollection = null;
    }
    if (intersections.length > 0) {
      nodeCollection = new wgl.PointCollection(intersections.length);
      intersections.forEach((intersect, id) => {
        var ui = nodeCollection.add(intersect.point, id);
        ui.setColor({r: 1, g: 25/255, b: 24/255})
      })
      scene.appendChild(nodeCollection);
    }
  }
}
