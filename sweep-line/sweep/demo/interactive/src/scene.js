import isect from '../../../';
import BBox from './BBox';
import appStatus from './appStatus';

export default createScene;

let wgl = require('w-gl');

function createScene(options, canvas) {
  var lines = options.lines;
  var isAsync = options.isAsync;
  var scene = wgl.scene(canvas);
  scene.setClearColor( 0x0C/255, 0x18/255, 0x34/255, 1);
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

  // var guidelines = new wgl.WireCollection(lines.length);
  // guidelines.color = {r: 0.1, g: 0.4, b: 0.8, a: 0.9};

  // ([
  //   {from: {x: -100, y: 0}, to: {x: 100, y: 0}},
  //   {from: {x: 0, y: -100}, to: {x: 0, y: 100}},
  // ]).forEach(function (line) {
  //   guidelines.add({ from: line.from, to: line.to });
  // });

  // scene.appendChild(guidelines);

  var linesEl = new wgl.WireCollection(lines.length);
  linesEl.color.r = 0xee/255;
  linesEl.color.g = 0xee/255;
  linesEl.color.b = 0xee/255;
  lines.forEach(function (line) {
    linesEl.add({ from: line.from, to: line.to });
  });

  scene.appendChild(linesEl);

  var iSector, nodeCollection;
  var status = {};
  var nextFrame;

  appStatus.error = null;
  if (isAsync) {
    appStatus.showMetrics = false;
    runAsync();
  } else {
    runSync();
    appStatus.showMetrics = true;
  }

  return {
    dispose
  }

  function runSync() {
    // eslint-disable-next-line
    var startTime = window.performance.now();
    iSector = isect(lines, { onError });
    var intersections = iSector.run();
    var elapsed = window.performance.now() - startTime;
    // eslint-disable-next-line
    console.log('finished in ' + elapsed + 'ms')
    // eslint-disable-next-line
    console.log('found ' + intersections.length + ' intersections');
    appStatus.found = nice(intersections.length);
    appStatus.elapsed = (Math.round(elapsed * 100)/100) + 'ms';
    appStatus.linesCount = nice(lines.length);
    drawIntersections(intersections);
  }

  function onError(err) {
    appStatus.error = 'Rounding error detected';
    drawSweepStatus(iSector.sweepStatus);
    drawIntersections(iSector.results);
    throw new Error(err);
  }

  function runAsync() {
    iSector = isect(lines);
    nextFrame = requestAnimationFrame(frame);

    // for console driven debugging
    window.next = () => {
      var hasMore = iSector.step();
      drawSweepStatus(iSector.sweepStatus);
      drawIntersections(iSector.results)
      return hasMore;
    }
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
        ui.setColor({r: 0xA3/244, g: 0x255/255, b: 0x255/255})
      })
      scene.appendChild(nodeCollection);
    }
  }
}

function nice(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}