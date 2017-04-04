var DAY_LENGTH = 30;
var DAY_PADDING = 5;
var INNER_CIRCLE_R = 100;
var BORDER_ANGLE = (2 * Math.PI/24) * 0.45; // 46% of angle is for border;
var dowNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
//
// var shapes =[
//     [0.97, 1, 0.5],
//     [0.57, 1, 0.5],
//     [0.87, 1, 0.5],
//     [0.67, 1, 0.5],
//     [0.77, 1, 0.5]
// ].map(hslColor => {
//   return (offset) => {
//      return sivg('path', {
//        d: ' M0 ' + (0 - offset * DAY_LENGTH) + 'l 10 -10 m -10 10 l -10 -10',
//        stroke: toHSL(hslColor),
//        fill: 'transparent'
//      });
//   }
// });
//
var shapes = [
  (offset) => {
     return sivg('path', {
       d: ' M0 ' + (0 - offset * DAY_LENGTH) + 'l 10 -10 m -10 10 l -10 -10',
       stroke: 'black',
       fill: 'transparent'
     });
  },

  (offset) => {
     return sivg('path', {
       d: ' M0 ' + (0 - offset * DAY_LENGTH) + 'l 10 -10 h -2.5 h 5 h -2.5 m -10 10 l -10 -10 h-2.5 h 5',
       stroke: 'black',
       fill: 'transparent'
     });
  },

  (offset) => {
    var start = (0 - offset * DAY_LENGTH);
     return sivg('path', {
       d: ' M0 ' + start + 'l 8 -8 h -3 L 0 ' + start + ' l -8 -8 h3 L0 ' + start,
       stroke: 'black',
       'stroke-width': 0.5,
       fill: 'transparent'
     });
  }
];

function toHSL(hsl) {
  var h = Math.round(hsl[0] * 360);
  var s = Math.round(hsl[1] * 100);
  var l = Math.round((hsl[2]) * 100);

  return 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
}

var scene = sivg(document.getElementById('scene'));
c = sivg('circle', {
  cx: 0,
  cy: 0,
  stroke: 'black',
  fill: 'transparent',
  r: INNER_CIRCLE_R
});
// scene.appendChild(c);
panzoom(scene);
scene.addEventListener('mouseenter', mouseEnterHandler, true);

var lastHighlighted;

function mouseEnterHandler(e) {
  if (!isTickBackground(e.target)) return;
  if (e.target === lastHighlighted) return;

  if (lastHighlighted) {
     removeClass('highlight')(lastHighlighted);
     forAll('.hour-hl', removeClass('hour-hl'));
     forAll('.dow-hl', removeClass('dow-hl'));
  }

  lastHighlighted = e.target;

  var hour = lastHighlighted.getAttribute('data-hour');

  forAll('[data-hour="' + hour + '"]' + ',' +
    '[data-hour-label="' + hour + '"]', addClass('hour-hl'))

  var dow = lastHighlighted.getAttribute('data-dow');
  forAll('[data-dow="' + dow + '"]', addClass('dow-hl'));
  addClass('highlight')(lastHighlighted);
}

function addClass(className) {
  return function(el) {
     el.classList.add(className);
  }
}
function removeClass(className) {
  return function(el) {
     el.classList.remove(className);
  }
}

function forAll(query, action) {
  (Array.from(scene.querySelectorAll(query))).forEach(function(el) {
     action(el);
  })
}

function isTickBackground(element) {
  return element && element.classList.contains('tick-background');
}

var hoursLabel = sivg('text', {
     'text-anchor': 'middle',
     'alignment-baseline': 'central',
     'font-size': '15px',
     'fill': 'black'
  });
  hoursLabel.text('HOURS');
  scene.appendChild(hoursLabel);

var data = getData().map(x => ({
  date: new Date(x.Date),
  symbol: x.Symbol
}));

for	(var hour = 0; hour < 24; ++hour) {
  drawLabel(hour);
  for (var dow = 0; dow < 7; ++dow) {
    drawTick(hour, dow);
    drawDayName(dow);
  }
}


function drawDayName(dow) {
  return;
  var r = getRadiusForDow(dow + 1) + 7;// small padding
  var dowLabel = sivg('text', {
    'text-anchor': 'middle',
    'font-size': '15px',
    'fill': 'black',
    'class': 'dow-label',
    'data-dow': dow,
     y: r
  });
  dowLabel.text(dowNames[dow]);
  scene.appendChild(dowLabel);
}

function drawLabel(hour) {
  var angle = (hour - 6) * 2 * Math.PI/24;
  var r = INNER_CIRCLE_R * 0.85;
  drawBackground(angle, INNER_CIRCLE_R * 0.725, INNER_CIRCLE_R * 0.25, {
    'class': 'hour-label',
    'data-hour-label': hour,
    fill: '#333'
  });
  var x = r * Math.cos(angle);
  var y = r * Math.sin(angle);

  var text = sivg('text', {
     x: x, y: y,
     'text-anchor': 'middle',
     'alignment-baseline': 'central',
     'font-size': '15px',
     'fill': 'white'
  });
  text.text(hour);
  scene.appendChild(text);
}

function drawBackground(angle, r, height, attributes) {
  var leftAngle = angle - BORDER_ANGLE;
  var lca = Math.cos(leftAngle);
  var lsa = Math.sin(leftAngle);
  var x0 = r * lca;
  var y0 = r * lsa;

  var largeR = r + height;
  var x1 = largeR * lca;
  var y1 = largeR  * lsa;

  var rca = Math.cos(angle + BORDER_ANGLE);
  var rsa = Math.sin(angle + BORDER_ANGLE);
  var x2 = largeR * rca;
  var y2 = largeR * rsa;
  var x3 = r * rca; var y3 = r * rsa;

  // left pole
  var d = 'M' + x0 + ' ' + y0 + ' L ' + x1 + ' ' + y1 +
  // upper arc
  ' A ' + largeR + ' ' + largeR + ' 0 0 1 ' + x2 + ' ' + y2 +
  // right pole
  ' L ' + x3 + ' ' + y3 +
  // bottom arc
  ' A ' + r + ' ' + r + ' 0 0 0 ' + x0 + ' ' + y0;

  var background = sivg('path', Object.assign({
    d: d,
    fill: 'transparent'
  }, attributes));
  scene.appendChild(background);
}

function getRadiusForDow(dow) {
  return INNER_CIRCLE_R + dow * (DAY_LENGTH + DAY_PADDING);
}

function drawTick(hour, dow) {
  var r = getRadiusForDow(dow);

  // -6 to adjust for clocks.
  var angle = (hour - 6) * 2 * Math.PI/24;
  drawBackground(angle, r, DAY_LENGTH, {
    'data-hour': hour,
    'data-dow': dow,
    'class': 'tick-background'
  });

  var x = r * Math.cos(angle);
  var y = r * Math.sin(angle);

  // rotate by PI/2 because angle === 0 is 6 o'clock on 24h circle.
  var deg = 180 * (angle + Math.PI/2) /Math.PI;
  var g = sivg('g', {
    transform: 'translate(' + x + ', ' + y + ') rotate(' + deg + ')'
  })
  g.appendChild(sivg('path', {
    d: 'M0,0 L0 ' + (-DAY_LENGTH) + ' ',
    stroke: '#999'
  }))


  var points = getAllPoints(dow, hour);
  points.forEach((point, i) => {
    var d = drawArrowForSymbol(point.symbol, i/points.length);
    var path;
    if (typeof d === 'string') {
      path = sivg('path', {
        d: d,
        stroke: 'black',
        fill: 'transparent'
      });
    } else {
      path = d;
    }
    g.appendChild(path);
  });
  scene.appendChild(g)
}

function getAllPoints(dow, hour) {
   return data.filter(x => {
      return (x.date.getDay() === dow) && (x.date.getHours() === hour);
   })
}


function drawArrowForSymbol(symbol, offset) {
  var shapeId = getHash(symbol) % (shapes.length);
  console.log(shapeId);
  return shapes[shapeId](offset);
}

function getHash(str) {
  if (!str) return 0; // if it's falsy object return null hash.

  const strType = typeof str;
  if (strType === 'number') return str;
  if (strType !== 'string') throw new Error('Only strings or numbers expected here');

  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return Math.abs(hash);
}


function getData() {
  return [
  {
    "Date": "03/27/2017 0:15:00",
    "Symbol": "Microwave at home",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 6:36:01",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 7:51:04",
    "Symbol": "Microwave at home",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 8:40:28",
    "Symbol": "Childcare",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 8:27:41",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 8:44:38",
    "Symbol": "Childcare exit",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 8:59:14",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 9:09:16",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 9:12:57",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 9:27:26",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 10:04:37",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 10:27:27",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 10:40:14",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 10:54:33",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 11:00:25",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 11:24:29",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 12:24:03",
    "Symbol": "Gym",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 14:25:59",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 14:47:11",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 15:38:22",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 16:48:40",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 19:38:34",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 19:59:04",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 20:45:14",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 21:51:28",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/27/2017 22:43:41",
    "Symbol": "Home PC",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 0:57:52",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 7:47:52",
    "Symbol": "Microwave at home",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 7:15:04",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 7:31:18",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 8:21:13",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 8:45:48",
    "Symbol": "Childcare",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 8:57:47",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 9:19:58",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 9:46:33",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 10:01:51",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 10:07:32",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 10:10:30",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 10:24:22",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 10:33:28",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 10:50:17",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 10:56:31",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 11:15:20",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 11:20:09",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 11:30:23",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 11:47:12",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 12:13:15",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 12:52:23",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 13:01:16",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 13:11:09",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 13:34:14",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 13:42:39",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 14:17:44",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 14:23:09",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 14:29:36",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 15:14:48",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 15:27:24",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 15:33:13",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 15:41:16",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 16:01:30",
    "Symbol": "Conference room",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 17:06:08",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 17:39:14",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 18:23:52",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 18:47:36",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 19:06:21",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 19:12:37",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 20:38:14",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 21:14:33",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 21:40:21",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 21:58:59",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 22:33:23",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "03/28/2017 23:59:03",
    "Symbol": "Home PC",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 4:03:20",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 8:09:40",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 8:41:32",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 8:56:36",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 9:13:00",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 9:17:46",
    "Symbol": "Childcare",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 9:22:46",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 9:34:44",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 10:29:03",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 10:38:01",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 11:13:46",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 11:28:02",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 11:31:01",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 11:33:37",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 11:41:38",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 11:54:54",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 12:27:02",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 12:41:30",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 13:02:49",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 13:12:55",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 13:21:13",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 13:34:42",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 13:45:09",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 13:59:21",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 14:21:16",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 14:30:19",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 14:43:26",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 14:59:19",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 15:36:48",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 15:50:22",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 16:31:35",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 16:45:02",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 17:16:08",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 17:53:59",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 18:20:24",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 19:01:32",
    "Symbol": "Microwave at home",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 20:57:04",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/29/2017 21:08:17",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 0:12:58",
    "Symbol": "Home PC",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 5:57:26",
    "Symbol": "Microwave at home",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 7:21:27",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 8:05:03",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 8:21:11",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 8:32:26",
    "Symbol": "Microwave at home",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 8:36:47",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 8:51:47",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 8:59:08",
    "Symbol": "Childcare",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 9:29:22",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 9:38:51",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 9:44:10",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 10:01:21",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 10:16:39",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 10:40:33",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 12:31:27",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 12:37:56",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 13:02:15",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 13:30:02",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 14:30:10",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 15:09:03",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 15:36:11",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 15:38:52",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 16:24:24",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 16:35:30",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 16:43:11",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 16:53:03",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 17:19:49",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 17:24:17",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 17:29:33",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 18:49:51",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 18:58:06",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 20:00:50",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 20:30:36",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 21:12:56",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 21:19:55",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 21:54:23",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 22:10:08",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 23:00:43",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/30/2017 23:40:11",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 0:01:05",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 0:32:34",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 1:03:18",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 1:31:23",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 1:39:58",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 7:29:25",
    "Symbol": "Microwave at home",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 7:33:38",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 7:45:20",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 8:01:28",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 8:08:48",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 8:18:08",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 8:29:08",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 8:31:22",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 8:35:58",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 8:40:16",
    "Symbol": "Childcare",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 9:08:41",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 9:11:56",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 9:42:45",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 10:49:40",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 11:01:04",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 11:02:27",
    "Symbol": "Elevator",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 11:29:57",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 11:41:31",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 12:08:10",
    "Symbol": "work laptop",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 12:12:27",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 12:22:12",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 12:31:48",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 12:34:21",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 12:40:50",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 12:44:02",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 13:07:12",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 13:11:27",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 13:28:52",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 13:38:20",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 13:45:30",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 14:15:29",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 14:47:20",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 14:57:49",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 15:22:08",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 15:31:07",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 16:24:42",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 17:11:36",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 17:24:21",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 18:41:38",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 19:00:25",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 19:31:53",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 20:27:50",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 20:17:58",
    "Symbol": "Wife",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 21:09:11",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 21:47:27",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 22:15:39",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 23:34:43",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "03/31/2017 23:43:31",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 0:09:15",
    "Symbol": "Microwave at home",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 6:32:55",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 7:33:06",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 8:03:32",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 9:15:09",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 11:59:34",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 12:08:38",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 12:37:22",
    "Symbol": "La Parisienne",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 15:26:04",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 16:12:50",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 16:22:43",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 16:58:16",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 17:35:09",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 17:48:24",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 18:30:43",
    "Symbol": "Microwave at home",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 18:37:08",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 19:44:23",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 20:16:52",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 20:25:21",
    "Symbol": "Car",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 20:42:13",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 21:15:48",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 21:51:26",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 22:39:24",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "04/01/2017 23:47:38",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 0:04:43",
    "Symbol": "Home PC",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 7:45:42",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 7:55:01",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 7:57:50",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 8:02:50",
    "Symbol": "Microwave at home",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 8:27:30",
    "Symbol": "Microwave at home",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 8:40:02",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 9:57:09",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 10:46:45",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 12:17:58",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 12:35:18",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 14:09:44",
    "Symbol": "Microwave at home",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 16:02:20",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 16:22:18",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 17:27:09",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 17:55:15",
    "Symbol": "Personal laptop",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 18:48:00",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 18:57:43",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 20:21:17",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 20:41:24",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 20:55:36",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 21:06:21",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 21:36:26",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 21:57:35",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 22:25:42",
    "Symbol": "iPhone",
    "Note to self": ""
  },
  {
    "Date": "04/02/2017 22:47:19",
    "Symbol": "iPhone",
    "Note to self": ""
  }
];
}
