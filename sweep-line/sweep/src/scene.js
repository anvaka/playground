import findIntersections from './findIntersections';

export default createScene;
let wgl = require('w-gl');

function createScene(lines, canvas) {
  var scene = wgl.scene(canvas);
  var initialSceneSize = 40;
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

  console.time('run')
  var intersections = findIntersections(lines);
  console.timeEnd('run')
  // eslint-disable-next-line
  console.log('found ' + intersections.length + ' intersections');
  let nodes = new wgl.PointCollection(intersections.length);
  intersections.forEach((intersect, id) => {
    var ui = nodes.add(intersect.point, id);
    ui.setColor({r: 1, g: 25/255, b: 24/255})
  })
  scene.appendChild(nodes);


}