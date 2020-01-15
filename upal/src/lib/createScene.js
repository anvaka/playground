import {geoMercator} from 'd3-geo';

const wgl = require('w-gl');

export default function createScene(graphInfo, canvas, bounds) {
  var projector = geoMercator()
    .center([bounds.cx, bounds.cy])
    .scale(6371393); // Radius of Earth

  let q = [0, 0];
  let scene = wgl.scene(canvas);
  scene.setClearColor(0xf7/0xff, 0xf2/0xff, 0xe8/0xff, 1.0)
  // scene.setClearColor(1, 1, 1, 1.0)
  let leftTop = project({lon: bounds.left, lat: bounds.top});
  let rightBottom = project({lon: bounds.right, lat: bounds.bottom});

  let width = (rightBottom.x - leftTop.x);
  let height = (rightBottom.y - leftTop.y);
  let initialSceneSize = Math.max(width, height) / 4;
  scene.setViewBox({
    left:  -initialSceneSize,
    top:   -initialSceneSize,
    right:  initialSceneSize,
    bottom: initialSceneSize,
  })

  let linkCount = graphInfo.linkCount;
  let nodes = graphInfo.nodes;
  let lines = new wgl.WireCollection(linkCount);
  //lines.color = {r: 0.8, g: 0.8, b: 0.8, a: 0.7}
  lines.color = {r: 0.1, g: 0.1, b: 0.1, a: 0.8}
  forEachLink(graphInfo.grid, function(fromId, toId) {
    let from = project(nodes.get(fromId))
    let to = project(nodes.get(toId))
    lines.add({from, to});
  });

  scene.appendChild(lines);

  return {
    render() {
      scene.renderFrame(true);
    },
    dispose() {
      let gl = canvas.getContext('webgl')
      if (gl) {
        gl.clear(gl.COLOR_BUFFER_BIT);
      }

      scene.dispose();
    }
  }

  function forEachLink(grid, callback) {
    grid.elements.forEach(element => {
      if (element.type === 'way') {
        for (let index = 1; index < element.nodes.length; ++index) {
          let from = element.nodes[index - 1];
          let to = element.nodes[index];
          callback(from, to);
        }
      }
    });
  }

  function project(lonLat) {
    q[0] = lonLat.lon; q[1] = lonLat.lat;

    let xyPoint = projector(q)

    return {
      x: xyPoint[0],
      y: xyPoint[1]
    };

  }
}