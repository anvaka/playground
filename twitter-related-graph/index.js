const buildGraph = require('./src/buildGraph');
const sivg = require('simplesvg');
const createPanZoom = require('panzoom');
const { FONT } = require('./constants');

module.exports = run;

function run() {
  let createLayout = window.ngraphCreate2dLayout; // require('ngraph.forcelayout/dist/ngraph.forcelayout2d.js')
  buildGraph().then(g => {
    let layout = createLayout(g, {
      adaptiveTimeStepWeight: 0.05,
      springLength: 15,
      gravity: -24
    });
    for (let i = 0; i < 450; ++i) layout.step();
    draw(layout, g);
  })
}

function draw(layout, graph) {
  let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  let container = sivg('g');
  let nodes = sivg('g');
  let links = sivg('g');
  let nodeHalfSize = 2.5;

  svg.style.width = '100%';
  svg.style.height = '300px';
  // svg.style.background = '#efefef';
  let clipCircle = sivg('clipPath', {id: 'clipCircle'});
  clipCircle.appendChild(sivg('circle', {
    cx: nodeHalfSize, cy: nodeHalfSize, r: nodeHalfSize
  }))
  svg.appendChild(clipCircle)
  svg.appendChild(container);

  container.appendChild(links);
  container.appendChild(nodes);

  graph.forEachLink(addLinkUI);
  graph.forEachNode(addNodeUI);
  let box = layout.simulator.getBoundingBox();
  let width = box.max_x - box.min_x;
  let height = box.max_y - box.min_y;
  let dx = width * 0.1; let dy = height * 0.1;
  let left = box.min_x - dx;
  let top = box.min_y - dy;
  width += dx * 2; height += 2 * dy;
  let viewBox = `${left} ${top} ${width} ${height}`;
  svg.setAttributeNS(null, 'viewBox', viewBox);

  let loader = document.querySelector('#map-loader')
  if (loader) loader.parentElement.removeChild(loader);

  let link = document.querySelector('a[href*="connect_people"]');
  if (link) {
    link.insertAdjacentElement('beforebegin', svg);
  } else {
    document.body.appendChild(svg);
  }
  let pz = createPanZoom(container);
  //pz.showRectangle({left, top, right: right + width, bottom: top + height })

  function addNodeUI(node) {
    let from = layout.getNodePosition(node.id);
    let nodeUI;
    if (node.data) {
      nodeUI = sivg('g', {
        'transform': `translate(${from.x - nodeHalfSize}, ${from.y - nodeHalfSize})`
      });
      let href = sivg('a', {target: '_blank'});
      href.link('/' + node.data.screenName);
      href.appendChild(sivg('image', {
        href:   node.data.image,
        width:  nodeHalfSize * 2,
        height: nodeHalfSize * 2,
        'clip-path': 'url(#clipCircle)'
      }))
      nodeUI.appendChild(href);
      let label = sivg('text', {
        x: nodeHalfSize,
        y: nodeHalfSize * 2 + nodeHalfSize * 0.5,
        'text-anchor': 'middle',
        // 'paint-order': 'stroke',
        // 'stroke': '#D9D9D9',
        // 'stroke-width': 0.1,
        'font-family': FONT,
        'fill': '#d9d9d9',
        'font-size': nodeHalfSize * 0.4 
      });
      label.text(node.data.screenName);
      nodeUI.appendChild(label);
    } else {
      nodeUI = sivg('circle', {
        cx: from.x,
        cy: from.y,
        fill: 'orange',
        r: nodeHalfSize * .9
      });
    }
    nodes.appendChild(nodeUI);
  }
  function addLinkUI(link) {
    let from = layout.getNodePosition(link.fromId);
    let to = layout.getNodePosition(link.toId);
    let ui = sivg('line', {
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      stroke: '#333333',
      'stroke-width': '0.1'
    });
    links.appendChild(ui);
  }
}
run();