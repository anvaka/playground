import isect from '../../../';
import BBox from './BBox';

export default createScene;

let wgl = require('w-gl');

function createScene(options, canvas) {
  var lines = options.lines;
  var isAsync = options.isAsync;
  var scene = wgl.scene(canvas);
  var bounds = new BBox();
  lines.forEach(line => {
    bounds.addPoint(line.from);
    bounds.addPoint(line.to);
  });

  scene.setViewBox({
    left:  bounds.left,
    top:   bounds.top,
    right:  bounds.right,
    bottom: bounds.bottom,
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

  var iSector, nodeCollection;
  var status = {};
  var nextFrame;

  if (isAsync) {
    runAsync();
  } else {
    runSync();
  }

  return {
    dispose
  }

  function runSync() {
    // eslint-disable-next-line
    console.time('run')
    iSector = isect(lines);
    var intersections = iSector.run();
    // eslint-disable-next-line
    console.timeEnd('run')
    // eslint-disable-next-line
    console.log('found ' + intersections.length + ' intersections');
    drawIntersections(intersections);
  }

  function runAsync() {
    iSector = isect(lines);
    nextFrame = requestAnimationFrame(frame);
  }
  function dispose() {
    if (nextFrame) {
      cancelAnimationFrame(nextFrame);
      nextFrame = 0;
    }
    scene.dispose();
  }

  function frame() {
    var hasMore;
    for (var i = 0; i < options.stepsPerFrame; ++i) {
      hasMore = iSector.step();
    }

    drawSweepStatus(iSector.sweepStatus);
    drawIntersections(iSector.results)

    if (hasMore) {
      nextFrame = requestAnimationFrame(frame);
    } else {
      nextFrame = null;
    }
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
