const wgl = require('w-gl');

export default function createScene(graph, canvas, projector) {
  let q = [0, 0];
  let scene = wgl.scene(canvas);
  scene.setClearColor(0xf7/255, 0xf2/255, 0xef/255, 1)


  let linksCount = graph.getLinksCount();
  let lines = new wgl.WireCollection(linksCount);
  //lines.color = {r: 0.8, g: 0.8, b: 0.8, a: 0.7}
  lines.color = {r: 0.1, g: 0.1, b: 0.1, a: 0.9}
  graph.forEachLink(function (link) {
    let fromLonLat = graph.getNode(link.fromId).data;
    let toLonLat = graph.getNode(link.toId).data
    let from = project(fromLonLat);
    let to = project(toLonLat);
    lines.add({ 
      from, 
      to
    });
    // lines.add({ 
    //   from: {x: from.x, y: from.y+1}, 
    //   to: {x: to.x, y: to.y + 1}
    // });
  });

  scene.appendChild(lines);

  return {
    dispose() {
      scene.dispose();
    }
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