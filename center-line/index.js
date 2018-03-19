var scene = document.getElementById('scene');
var sivg = require('simplesvg');
var d3 = require('d3-voronoi');
var graph = require('ngraph.graph')();
var aStar = require('ngraph.path').aStar;
var simplify = require('simplify-js');
var panzoom = require('panzoom');
panzoom(scene)

var drawDebug = false;

var polyline = initPath(getPolyline());

var pathData = polyline.getPath();
var data = `M${pathData[0]},${pathData[1]}L` + 
    pathData.slice(2, pathData.length).join(',') + 'Z';

scene.appendChild(sivg('path', {
  d: data,
  fill: 'transparent',
  stroke: 'black',
  'stroke-width': 0.4
}));
var points = [];
polyline.forEachSegment(50, (sx, sy, ex, ey) => {
  points.push(ex, ey);
  if (drawDebug) {
    scene.appendChild(sivg('circle', {
      cx: ex,
      cy: ey,
      r: 0.5,
      fill: 'orangered'
    }))
  }
});


var bounds = polyline.getMinMax();
var voronoi = d3.voronoi();
voronoi.x(function(x) {
  return x;
}).y(function(x, i, data) {
  return data.getY(i);
});  

voronoi.extent([[bounds.minX, bounds.minY], [bounds.maxX, bounds.maxY]]);
var res = voronoi({ 
  map: function(callback) {
    var p = [];
    for (var i = 0; i < points.length; i += 2) {
      p.push(callback(points[i], i));
    }
    return p;
  },
  getY(i) {
    return points[i + 1];
  } 
});

res.edges.forEach(edge => {
  if (!edge.right) {
    return;
  } 
  
  // TODO: Optimize this lookup?
  if (edge[0][0] === 450.41384705462923) debugger;
  var intersection = getIntersectionPoint(edge, pathData);
  var isInside = false;
  if (!intersection) {
    isInside = edgeInsidePolygon(edge, pathData);
  }
 if (!(intersection || isInside)) return;

  var fx, fy, tx, ty;
  if (isInside) {
    fx = edge[0][0]; fy = edge[0][1];
    tx = edge[1][0]; ty = edge[1][1];
  } else if (intersection) {
    fx = intersection.x; fy = intersection.y;
    tx = intersection.x0; ty = intersection.y0;
  }
  graph.addNode(nodeId(fx, fy), {x: fx, y: fy});
  graph.addNode(nodeId(tx, ty), {x: tx, y: ty});
  graph.addLink(nodeId(fx, fy), nodeId(tx, ty), {
    length: Math.sqrt((fx - tx) * (fx - tx) + (fy - ty) * (fy - ty))
  });

  if (drawDebug) {
    scene.appendChild(sivg('path', {
      d: 'M' + fx + ',' + fy + 'L' + tx + ',' + ty,
      fill: 'transparent',
      stroke: 'black',
      'stroke-width': 0.04
    }));
  }
});

console.time('path');
var longestPath = getLongestShortestPath()
console.timeEnd('path');

var fontSize = getRecommendedFontSize(longestPath);
var changeOrientation = shouldChangeOrientation(longestPath);
if (changeOrientation) longestPath.reverse();
var simplifiedPoints = simplify(longestPath.map(x => x.data))

var data = simplifiedPoints.map((pt, i) => {
  var prefix = '';
  if (i === 0) prefix = 'M';
  if (i === 1) prefix = 'L';
  return prefix + pt.x + ',' + pt.y;
}).join(' ');


scene.appendChild(sivg('path', {
  d: data,
  fill: 'transparent',
  id: 'center',
  stroke: 'blue',
  'stroke-width': drawDebug ? 1.0 : 0
}));
var text = sivg('text', {
  'dy': fontSize/4
})
var textContent = sivg('textPath', {
  'font-size': fontSize + 'px',
  'link': '#center',
  'startOffset': '50%',
  'text-anchor': 'middle'
});
textContent.text('Hello World');
text.appendChild(textContent);
scene.appendChild(text)


function shouldChangeOrientation(shortestPath) {
  var points = [];
  shortestPath.forEach(function(p) {
    points.push(p.data.x, p.data.y);
  });

  var pathInfo = initPath(points);
  var overPI2Count = 0;
  var pointsToCheck = 5;
  pathInfo.forEachSegment(pointsToCheck, function(sx, sy, ex, ey) {
    var angle = Math.atan2(ey - sy, ex - sx);
    if (angle > Math.PI/2) overPI2Count += 1;
  });

  return overPI2Count < pointsToCheck/2;
}

function getLongestShortestPath() {
  var seenPaths = new Set();
  var longestPath;
  var longestPathLength = Number.NEGATIVE_INFINITY;

  var pathFinder = aStar(graph, {
    distance: function(fromNode, toNode, link) {
      return link.data.length;
    },
    heuristic: function(fromNode, toNode) {
      return distance(fromNode.data, toNode.data);
    }
  });

  graph.forEachNode(function(fromNode) {
    graph.forEachNode(function (toNode) {
      if (fromNode === toNode) return;
      var pathKey = nodeId(fromNode.id, toNode.id);
      if (seenPaths.has(pathKey)) return;
      var path = pathFinder.find(fromNode.id, toNode.id);
      seenPaths.add(pathKey);

      if (!path) return;
      var length = getPathLength(path);
      if (length > longestPathLength) {
        longestPathLength = length;
        longestPath = path;
      }
    })
  });

  return longestPath;

  function getPathLength(path) {
    var length = 0;
    for (var i = 0; i < path.length - 1; ++i) {
      length += distance(path[i].data, path[i + 1].data);
    }
    return length;
  }

  function distance(a, b) {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
  }
}

function getRecommendedFontSize(points) {
  var avgLinkLength = 0;
  var count = 0;
  for (var i = 0; i < points.length; ++i) {
    var pt = points[i];
    graph.forEachLinkedNode(pt.id, visitLink);
  }

  return 2 * 0.85 * avgLinkLength/count;

  function visitLink(other, link) {
    avgLinkLength += link.data.length;
    count += 1;
  }
}

function getIntersectionPoint(edge, path) {
  for (var i = 0; i < path.length - 2; i += 2) {
    var intersect = getIntersect(
      edge[0][0], edge[0][1], edge[1][0], edge[1][1],
      path[i], path[i + 1], path[i + 2], path[i + 3]);
    if (intersect) {
      var end = edge[0];
      if (pointInPolygon(edge[1][0], edge[1][1], path)) end = edge[1];
      intersect.x0 = end[0];
      intersect.y0 = end[1];
      return intersect;
    }
  }
}

function nodeId(x, y) {
  return x < y ? x + ',' + y : y + ',' + x;
}

function edgeInsidePolygon(edge, polygon) {
  return pointInPolygon(edge[0][0], edge[0][1], polygon) || pointInPolygon(edge[1][0], edge[1][1], polygon);
}

function pointInPolygon(x, y, polygon) {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
  var xi, xj, yi, yj, i, intersect, inside = false;
  var j = polygon.length - 2;
  for (i = 0; i < polygon.length; i += 2) {
    xi = polygon[i];
    yi = polygon[i + 1];
    xj = polygon[j];
    yj = polygon[j + 1];
    
    intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
    j = i;
  }
  
  return inside;
}


function getIntersect(
    p0_x, p0_y, p1_x, p1_y, 
    p2_x, p2_y, p3_x, p3_y) {
    var s1_x, s1_y, s2_x, s2_y;
    s1_x = p1_x - p0_x; s1_y = p1_y - p0_y;
    s2_x = p3_x - p2_x; s2_y = p3_y - p2_y;

    var s, t;
    s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
    t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        // Collision detected
      var iX= p0_x + (t * s1_x);
      var iY= p0_y + (t * s1_y);
      return {
        x: iX, y: iY
      };
    }
}

function initPath(polyline) {
  var totalLength;
  var minMax;
  var api = {
    getTotalLength: getTotalLength,
    getMinMax: getMinMax,
    forEachSegment: forEachSegment,
    getPath: getPath
  };
  
  return api;
  
  function getPath() {
    return polyline;
  }
  
  
  function forEachSegment(segmentsCount, callback) {
    var segmentLength = getTotalLength()/segmentsCount;
    var cx = polyline[0];
    var cy = polyline[1];
    var distanceToCover = segmentLength;
    
    
    for (var i = 2; i <= polyline.length; i += 2) {
      var idx = i % polyline.length;
      var ex = polyline[idx];
      var ey = polyline[idx + 1];        
      var dx = ex - cx; 
      var dy = ey - cy;
      var l = Math.sqrt(dx * dx + dy * dy);
      if (l === 0) continue;
      
      if (l >= distanceToCover) {
        var nx = dx/l;
        var ny = dy/l;
        var tx = cx + nx * distanceToCover;
        var ty = cy + ny * distanceToCover;
        
        callback(cx, cy, tx, ty);
        cx = tx; cy = ty;
        distanceToCover = segmentLength;
        i -= 2;
        continue;
      } else {
        // we don't have enough length on this segment. Just advance the pointer
        // and count whatever we have.
        distanceToCover -= l;
        cx = ex;
        cy = ey;
      }
    }
  }
  
  function getTotalLength() {
    if (totalLength !== undefined) return totalLength;
    var length = 0;
    for (var i = 0; i < polyline.length - 2; i += 2) {
      var dx = polyline[i + 2] - polyline[i];
      var dy = polyline[i + 3] - polyline[i + 1];
      length += Math.sqrt(dx * dx + dy * dy);
    }
    totalLength = length;
    return length;
  }
  
  function getMinMax() {
    if (minMax) return minMax;    
    var minX = Number.POSITIVE_INFINITY;
    var minY = Number.POSITIVE_INFINITY;
    var maxX = Number.NEGATIVE_INFINITY;
    var maxY = Number.NEGATIVE_INFINITY;

    for (var i = 0; i < polyline.length; i += 2) {
      var x = polyline[i];
      var y = polyline[i + 1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    minMax = {
      minX: minX,
      minY: minY,
      maxY: maxY,
      maxX: maxX
    }
    return minMax;
  }
}

function getPolyline() {
  return [676.1476382433749,211.6388902960835 ,675.8648666273903,213.49774399643914 ,676.5246670646878,215.08700252526342 ,674.4510085474668,214.57975151939675 ,672.2830928249176,215.84558960897783 ,672.3773500302458,217.7302146246074 ,672.0945784142612,218.7907889229996 ,672.9428932622152,220.64965937206674 ,675.3935806007491,222.43145844366754 ,676.7131814753443,225.4093786496691 ,679.6351548405194,228.28810802281203 ,681.7088133577403,228.28810802281203 ,682.3686137950378,229.0614253617496 ,681.614556152412,229.7137038518086 ,683.9709862856178,231.01265090761868 ,685.8561303921822,232.06994250725927 ,688.1183033200597,233.82134474889273 ,688.4010749360443,234.46021453352375 ,687.9297889094032,235.73271843348869 ,686.4216736241516,234.11195817275467 ,684.1595006962741,233.5303662293253 ,683.0284142323354,235.79039523922447 ,684.9135583389,236.99834899952856 ,684.6307867229153,238.7703152747235 ,683.5939574643048,238.99799830376935 ,682.1800993843814,241.82599983014933 ,681.0490129204427,242.1069930846211 ,681.0490129204427,241.09389579414318 ,681.614556152412,239.28229768021706 ,682.1800993843814,238.59941046537753 ,681.143270125771,236.596386162824 ,680.3892124831451,234.9237465951264 ,679.2581260192064,234.46021453352375 ,678.5040683765806,233.0056798845478 ,676.8074386806725,232.36276998110822 ,675.6763522167338,230.95376865382684 ,673.6969509048411,230.7180872431432 ,671.7175495929483,229.18016177487794 ,669.2668622544144,226.8533964203292 ,667.475975353178,224.80491175460352 ,666.7219177105522,221.26573107071067 ,665.4023168359571,220.8346655532314 ,663.2344011134079,219.5982773678874 ,662.1033146494691,220.09368579739524 ,660.5951993642175,221.81869884890023 ,659.4641129002788,222.0640101991204 ,659.7468845162634,220.52623367023227 ,658.3330264363401,220.03182218993257 ,657.6732259990425,217.16658621704957 ,658.6157980523247,216.03481003851678 ,657.7674832043707,214.64322504828144 ,657.9559976150272,213.56154692669364 ,659.0870840789659,214.38921543526163 ,660.3124277482328,214.19850574288859 ,661.7262858281563,212.92263651760572 ,662.1975718547974,213.56154692669364 ,663.5171727293925,213.4339215328982 ,664.0827159613618,211.8962765295289 ,665.9678600679265,212.3459339896331 ,667.0989465318652,211.70326688412115 ,667.3817181478498,210.1526581035639 ,668.8898334331014,210.73550454985275 ,669.2668622544144,209.9580081285904 ,671.8118067982765,209.30783774072808 ,672.3773500302458,210.67082530125893]
  //return [464.3516978708497,410.6656145846269 ,464.6344694868344,411.3389100103933 ,463.69189743355207,414.33507103174736 ,460.86418127370536,415.7448486396242 ,460.9584384790336,420.5506461084766 ,460.3928952470642,421.49016929522395 ,461.24121009501823,422.68070461699006 ,459.3560659884537,424.47458256974 ,457.6594362925456,427.2849855178184 ,456.7168642392634,429.9681345398203 ,456.90537864991984,432.93165621360663 ,455.30300615933993,436.02882558407697 ,456.5283498286069,441.37215002689567 ,457.1881502659045,441.9545600691283 ,457.1881502659045,444.8854900254919 ,455.68003498065286,447.95736524792346 ,455.77429218598104,450.6821218197607 ,453.7948908740883,452.772544199246 ,453.7948908740883,455.77345071781014 ,454.64320572204235,459.0379718750355 ,453.0408332314625,460.2878619350623 ,452.38103279416487,463.26851960594433 ,451.72123235686735,466.8141387687348 ,452.19251838350846,471.0709888738769 ,451.15568912489795,471.78834581864203 ,451.72123235686735,475.8978026995083 ,452.94657602613427,477.24398972415185 ,452.004003972852,478.7839671489715 ,453.2293476421189,479.5270850206331 ,453.51211925810367,480.89620184612374 ,452.38103279416487,481.5840717876896 ,452.6638044101496,483.78773447181527 ,451.72123235686735,488.7838909989763 ,450.30737427694396,492.1173683391821 ,450.68440309825684,494.1041103239555 ,449.8360882503028,496.581793298929 ,447.76242973308183,498.3414798994472 ,448.0452013490665,502.67161684659885 ,448.98777340234875,504.1365866899056 ,450.68440309825684,503.85669112356277 ,450.68440309825684,507.02914667762445 ,451.72123235686735,509.461364399943 ,458.0364651138585,510.0381872297294 ,460.4871524523924,510.68921341714395 ,458.1307223191867,510.68921341714395 ,456.90537864991984,511.70638704918497 ,454.5489485167141,513.3159535758604 ,454.077662490073,517.4013473203995 ,453.0408332314625,517.4764617798984 ,450.02460266095926,516.0544478885136 ,447.00837209045596,513.0222805558433 ,443.8036271092963,510.54434777463746 ,442.95531226134227,507.88404715890715 ,443.7093699039681,505.4011509281641 ,442.3897690293729,502.67161684659885 ,442.01274020806,495.77485185620486 ,443.1438266719987,491.9856105244129 ,445.9715428318455,489.0433850895553 ,441.91848300273176,487.8782310821752 ,444.46342754659383,484.54861660277084 ,445.3117423945479,478.41336915487744 ,448.23371575972294,479.7132673524304 ,449.6475738396464,472.20787134928867 ,447.85668693841006,471.3098521631738 ,447.00837209045596,475.71487460139144 ,445.40599959987617,475.22781342440885 ,446.2543144478302,470.1775112377959 ,447.10262929578425,463.7304487337696 ,448.32797296505123,461.42983059513693 ,447.57391532242536,458.13302351093006 ,447.3854009117689,454.4352385069231 ,448.4222301703794,454.32404661498094 ,450.02460266095926,449.04381609360485 ,451.90974676752376,443.9761601853671 ,452.94657602613427,439.31709021744484 ,452.38103279416487,434.6826880730931 ,453.13509043679073,432.1624231432086 ,452.85231882080603,428.49712378752827 ,454.3604341060577,424.8245397204362 ,454.8317201326988,419.1707919736726 ,455.68003498065286,413.1724292951343 ,456.5283498286069,406.8401220789443 ,456.33983541795044,402.29582298717685 ,455.77429218598104,398.3575171549372 ,457.0938930605763,397.6577290147136 ,457.84795070320206,396.2611723766953 ,459.07329437246904,398.12414095816433 ,459.4503231937819,400.13495677807146 ,460.86418127370536,401.3080586831711 ,460.01586642575126,403.9942881156854 ,461.4297245056747,407.12577660972596 ,462.4665537642852,411.0502110187084 ]
}
// function getPolyline() {
//   return [723.18198370216,189.10773129416808 ,724.2188129607705,189.32407892834502 ,724.8786133980681,188.31234175408503 ,725.6326710406939,188.52959696459575 ,728.3661299952124,188.16736652437828 ,730.0627596911205,190.54542705116708 ,729.4029592538229,191.40287398099701 ,729.5914736644794,192.68189127374467 ,731.6651321817004,192.89423522111773 ,732.6077042349826,194.724817736541 ,732.6077042349826,195.56389379541866 ,735.9067064214706,196.95435260773132 ,737.8861077333634,196.3298747485208 ,739.4884802239432,198.2661740867401 ,740.9965955091948,198.19734958764263 ,744.8611409276522,199.50090752291527 ,744.9553981329803,200.727948492754 ,743.8243116690417,202.7562729404752 ,744.4841121063391,204.9638587052311 ,744.0128260796981,206.2900770248085 ,741.467881535836,206.5542784566182 ,740.1482806612407,207.6733072067061 ,740.0540234559126,209.372947687818 ,737.9803649386917,209.69818735348952 ,736.2837352427836,210.92942053652192 ,733.8330479042496,211.12315426995949 ,731.5708749763721,212.53834619136796 ,731.6651321817004,214.8969271263282 ,732.9847330562956,215.78247835918742 ,735.623934805486,215.52984404455628 ,735.1526487788448,216.85281089070833 ,732.2306754136698,217.54250468747696 ,728.7431588165255,219.6602659777299 ,727.2350435312737,218.91521643344785 ,727.8005867632431,217.16658621704957 ,724.9728706033964,216.09784579774944 ,725.4441566300375,215.3401690543816 ,727.8948439685714,214.13489718519628 ,727.1407863259456,213.24233676708008 ,723.0877264968318,212.28175690891737 ,722.8992120861753,210.86480214910927 ,720.5427819529697,211.38118326337903 ,719.5059526943592,213.4339215328982 ,717.5265513824664,216.22386084089632 ,716.3012077131995,215.5930310542802 ,715.0758640439325,216.1608627262945 ,713.9447775799938,215.4666380526207 ,714.6045780172914,215.08700252526342 ,715.0758640439325,213.81656366491993 ,715.7356644812301,212.60244397132254 ,715.5471500705737,211.8962765295289 ,716.112693302543,211.57449365811772 ,716.3954649185278,212.1533431199447 ,717.9035802037794,212.21755995832598 ,718.5633806410768,211.96057309861587 ,718.0920946144358,211.57449365811772 ,718.2806090250922,210.99401867358932 ,717.4322941771381,210.02291195643872 ,717.0552653558253,208.39411476218245 ,716.0184360972147,207.8045531143089 ,716.2069505078713,206.4882604387468 ,715.0758640439325,205.4290282398042 ,713.9447775799938,205.2962322973033 ,712.0596334734292,204.03027728056568 ,710.268746572193,204.43091542471169 ,709.7032033402236,205.03037736033056 ,708.5721168762849,205.03037736033056 ,707.9123164389873,205.9593389408107 ,706.0271723324228,206.2900770248085 ,705.0846002791404,206.88404603627671 ,703.8592566098736,205.9593389408107 ,702.1626269139655,205.9593389408107 ,700.5602544233856,205.49539340040843 ,699.4291679594469,206.35615974269066 ,699.2406535487904,205.2962322973033 ,697.8267954688671,204.2306964081364 ,698.2980814955082,202.62169314202563 ,699.052139138134,201.60943390699694 ,699.6176823701034,201.81229848018185 ,698.9578819328058,200.0472009869731 ,701.3143120660114,196.60766747918254 ,702.6339129406066,196.19082965273947 ,702.9166845565913,195.00491341983616 ,701.5970836819961,191.3315666853432 ,702.8224273512631,191.1888723572416 ,704.2362854311864,190.04346648699106 ,706.3099439484074,189.97164987089604 ,708.9491456975978,190.25875417668354 ,711.8711190627729,191.3315666853432 ,713.9447775799938,191.40287398099701 ,714.887349633276,191.97237893076607 ,715.9241788918865,191.26023281943773 ,716.5839793291841,192.25649848161316 ,718.9404094623898,192.04344826037232 ,719.9772387210003,192.46931258954768 ,720.1657531316567,190.33046277567348 ,721.0140679796108,189.39614014574835]
// }
