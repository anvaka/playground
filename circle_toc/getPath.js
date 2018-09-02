
var colors = [
  '#58A55C',
  '#5186EC',
  '#D95040',
  '#F2BD42',
]

var levelStep = 42;
var initialRadius = 100;
var tree = {
  children: [getData()]
};
var path = getPath(tree.children[0])
scene.innerHTML = path;
panzoom(document.getElementById('scene'), {
  autocenter: true
});

var tooltipManager = createTooltipManager(document.querySelector('.tooltip'));
var textReader = createTextReader(document.querySelector('.content'));
 
document.body.addEventListener('mousemove', handleMouseMove);
document.body.addEventListener('click', handleMouseClick);
document.querySelector('.close').addEventListener('click', closeDetails);

function closeDetails() {
  textReader.hide();
}
function handleMouseClick(e) {
  var path = e.target.getAttribute('data-path');
  if (!path) {
//     textReader.hide();
    return;
  }
  e.preventDefault();

  var treeElement = getTreeElementByPath(path);
  textReader.show(treeElement);
}

function createTextReader(domEl) {
  var visible = false;
  var header = domEl.querySelector('h3');
  var content = domEl.querySelector('.details');
  
  return {
    show: show,
    hide: hide
  };
  
  function show(tree) {
    domEl.style.display = 'block';    
    content.innerHTML = tree.html;
    header.innerText = tree.name;
    visible = true;
  }
  function hide() {
    domEl.style.display = 'none';
    visible = false;
  }
}

function handleMouseMove(e) {
  var path = e.target.getAttribute('data-path');
  if (!path) {
    tooltipManager.hide();
    return;
  }
  var treeElement = getTreeElementByPath(path);
  tooltipManager.showTooltip(treeElement, e);
}

function createTooltipManager(domEl) {
  var tooltipWidth = 300;
  var lastText;
  var height = 0;
  var hidden = true;
  
  return {
    showTooltip: showTooltip,
    hide: hide
  }
  
  function hide() {
    domEl.style.display = 'none';
    hidden = true;
  }
  
  function showTooltip(tree, e) {
    if (hidden) {
      domEl.style.display = 'block';
      hidden = false;
    }
    if (lastText !== tree.name) {
      domEl.innerText = tree.name;
      lastText = tree.name;
      height = domEl.getBoundingClientRect().height;
    }
    var x = e.clientX - tooltipWidth/2;
    if (x + tooltipWidth > window.innerWidth) {
      x = window.innerWidth - tooltipWidth;
    }
    if (x < 0) x = 0;
    domEl.style.left = x + 'px';
    domEl.style.top = (e.clientY - height) + 'px';
  }
}

function getTreeElementByPath(path) {
  var root = tree;

  path.split(':').forEach(idx => {
    root = root.children[idx];
  })
  
  return root;
}

function getPath(tree) {
  // var pathElements = [];
  // pathElements.push(circle(tree));

  var totalLeaves = countLeaves(tree);
  var pathElements = [];
  pathElements.push(circle(initialRadius))

  
  var level = 1;
  var startAngle = -Math.PI/2 - 0.21918088280859022;
  var path = '0';
  tree.children.forEach((child, i) => {
    var da = 2 * Math.PI * child.leaves/totalLeaves;
    var endAngle = startAngle + da;
    var arcPath = pieSlice(initialRadius, level * levelStep, startAngle, endAngle);
    var thisPath = path + ':' + i;
    pathElements.push(arc(arcPath, colors[i], 0, thisPath));

    drawChildren(startAngle, endAngle, child, pathElements, level, colors[i], thisPath);

    startAngle += da;
  })

  return pathElements.join('\n');
}

function drawChildren(startAngle, endAngle, tree, pathElements, level, color, path) {
  if (!tree.children) return;

  var arcLength =  Math.abs(startAngle - endAngle);
  var totalLeaves = tree.leaves;
  tree.children.forEach((child, i) => {
    var da = arcLength * child.leaves/totalLeaves;
    var endAngle = startAngle + da;
    var arcPath = pieSlice(initialRadius + level * levelStep,
      levelStep, startAngle, endAngle);
    var thisPath = path + ':' + i;
    pathElements.push(arc(arcPath, color, level, thisPath));

    drawChildren(startAngle, endAngle, child, pathElements, level + 1, color, thisPath);

    startAngle += da;
  });
}

function polarToCartesian(centerX, centerY, radius, angle) {
  return {
    x: centerX + (radius * Math.cos(angle)),
    y: centerY + (radius * Math.sin(angle))
  };
}

function arcSegment(radius, startAngle, endAngle, forward = 1) {
  var cx = 0;
  var cy = 0;

  var start = polarToCartesian(cx, cy, radius, startAngle);
  var end = polarToCartesian(cx, cy, radius, endAngle);
  var da = Math.abs(startAngle - endAngle);
  var flip = da > Math.PI ? 1 : 0;
  var d = [
    "M", start.x, start.y,
    "A", radius, radius, 0, flip, forward, end.x, end.y
  ].join(" ");
  return {
    d: d,
    start: start,
    end: end
  }
}

function pieSlice(r, width, startAngle, endAngle) {
  var inner = arcSegment(r, startAngle, endAngle);
  var out = arcSegment(r + width, endAngle, startAngle, 0);
  return inner.d +
                 'L' + out.start.x + ' ' + out.start.y +
                 out.d +
                 'L' + inner.start.x + ' ' + inner.start.y;
}

function circle(r) {
  return '<circle r=' + r + ' cx=0 cy=0 fill="#fafafa" data-path="0"></circle>';
}

function arc(pathData, color, level = 0, path) {
  return '<path d="' + pathData + '" stroke="' + 'white' 
    + '" fill="' + color + '" class="arc level-' + level + '" data-path="' + path +'"></path>'
}

function countLeaves(treeNode) {
  if (treeNode.leaves) return treeNode.leaves;

  var leaves = 0;
  if (treeNode.children) {
    treeNode.children.forEach(child => {
      leaves += countLeaves(child);
    })
  } else {
    leaves = 1;
  }
  treeNode.leaves = leaves;
  return leaves; 
}
