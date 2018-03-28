var colors = ['#58A55C', '#5186EC', '#D95040', '#F2BD42'];
var getData = require('./data.js');
var levelStep = 42;
var initialRadius = 100;
var tree = {
  children: [getData()],
  path: '0',
};

var orderedChildren = makeOrderedChildren(tree);

var path = getPath(tree.children[0]);
var scene = document.getElementById('scene');
scene.innerHTML = path;

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
    return;
  }
  e.preventDefault();

  var treeElement = getTreeElementByPath(path);
  textReader.show(treeElement);
  tooltipManager.hide();
}

function createTextReader(domEl) {
  var header = domEl.querySelector('h3');
  var content = domEl.querySelector('.details');
  var prevBtn = document.querySelector('.prev');
  var nextBtn = document.querySelector('.next');

  return {
    show: show,
    hide: hide
  };

  function show(tree) {
    document.body.classList.add('content-open');
    domEl.style.display = 'flex';
    content.innerHTML = tree.html;
    header.innerText = tree.name;
    content.parentElement.scrollTop = 0;

    var next = orderedChildren.getNext(tree)
    if (!next) next = tree;
    if (next) {
      nextBtn.style.display = 'block';
      nextBtn.innerText = 'Next';
      nextBtn.setAttribute('data-path', next.path);
    } else {
      nextBtn.style.display = 'none';
    }

    var prev = orderedChildren.getPrev(tree);
    if (prev) {
      prevBtn.style.display = 'block';
      prevBtn.innerText = 'Prev';
      prevBtn.setAttribute('data-path', prev.path);
    } else {
      prevBtn.style.display = 'none';
    }

  }
  function hide() {
    domEl.style.display = 'none';
    document.body.classList.remove('content-open');
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
  };

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
    var x = e.clientX - tooltipWidth / 2;
    if (x + tooltipWidth > window.innerWidth) {
      x = window.innerWidth - tooltipWidth;
    }
    if (x < 0) x = 0;

    var y = e.clientY - height;
    if (y < 0) y = 0;

    domEl.style.left = x + 'px';
    domEl.style.top = y + 'px';
  }
}

function getTreeElementByPath(path) {
  var root = tree;

  path.split(':').forEach(function (idx) {
    root = root.children[idx];
  });

  return root;
}

function getPath(tree) {
  var totalLeaves = countLeaves(tree);
  var pathElements = [];
  pathElements.push(circle(initialRadius));

  var level = 1;
  var startAngle = -Math.PI / 2 - 0.21918088280859022;
  var path = '0';
  tree.path = path;
  tree.children.forEach(function (child, i) {
    var da = 2 * Math.PI * child.leaves / totalLeaves;
    var endAngle = startAngle + da;
    var arcPath = pieSlice(initialRadius, level * levelStep, startAngle, endAngle);
    var thisPath = path + ':' + i;
    child.path = thisPath;
    pathElements.push(arc(arcPath, colors[i], 0, thisPath));

    drawChildren(startAngle, endAngle, child, pathElements, level, colors[i], thisPath);

    startAngle += da;
  });

  return pathElements.join('\n');
}

function drawChildren(startAngle, endAngle, tree, pathElements, level, color, path) {
  if (!tree.children) return;

  var arcLength = Math.abs(startAngle - endAngle);
  var totalLeaves = tree.leaves;
  tree.children.forEach(function (child, i) {
    var da = arcLength * child.leaves / totalLeaves;
    var endAngle = startAngle + da;
    var arcPath = pieSlice(initialRadius + level * levelStep, levelStep, startAngle, endAngle);
    var thisPath = path + ':' + i;
    child.path = thisPath;
    pathElements.push(arc(arcPath, color, level, thisPath));

    drawChildren(startAngle, endAngle, child, pathElements, level + 1, color, thisPath);

    startAngle += da;
  });
}

function polarToCartesian(centerX, centerY, radius, angle) {
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  };
}

function arcSegment(radius, startAngle, endAngle) {
  var forward = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;

  var cx = 0;
  var cy = 0;

  var start = polarToCartesian(cx, cy, radius, startAngle);
  var end = polarToCartesian(cx, cy, radius, endAngle);
  var da = Math.abs(startAngle - endAngle);
  var flip = da > Math.PI ? 1 : 0;
  var d = ["M", start.x, start.y, "A", radius, radius, 0, flip, forward, end.x, end.y].join(" ");
  return {
    d: d,
    start: start,
    end: end
  };
}

function pieSlice(r, width, startAngle, endAngle) {
  var inner = arcSegment(r, startAngle, endAngle);
  var out = arcSegment(r + width, endAngle, startAngle, 0);
  return inner.d + 'L' + out.start.x + ' ' + out.start.y + out.d + 'L' + inner.start.x + ' ' + inner.start.y;
}

function circle(r) {
  return '<circle r=' + r + ' cx=0 cy=0 fill="#fafafa" data-path="0"></circle>';
}

function arc(pathData, color) {
  var level = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var path = arguments[3];

  return '<path d="' + pathData + '" stroke="' + 'white' + '" fill="' + color + '" class="arc level-' + level + '" data-path="' + path + '"></path>';
}

function countLeaves(treeNode) {
  if (treeNode.leaves) return treeNode.leaves;

  var leaves = 0;
  if (treeNode.children) {
    treeNode.children.forEach(function (child) {
      leaves += countLeaves(child);
    });
  } else {
    leaves = 1;
  }
  treeNode.leaves = leaves;
  return leaves;
}

function makeOrderedChildren(tree) {
  var lookup = new Map();
  var treeMemory = [];
  memorizeTree(tree);

  return {
    getNext: getNext,
    getPrev: getPrev
  };

  function getNext(treeElement) {
    return advance(treeElement, 1);

  }

  function getPrev(treeElement) {
    return advance(treeElement, -1)
  }

  function advance(treeElement, dx) {
    var idx = lookup.get(treeElement) + dx;
    if (!Number.isFinite(idx)) return;
    if (idx < 0 || idx >= treeMemory.length) return;
    return treeMemory[idx];
  }

  function memorizeTree(tree) {
    treeMemory.push(tree);
    lookup.set(tree, treeMemory.length - 1);
    if (tree.children) {
      tree.children.forEach(memorizeTree);
    }
  }
}