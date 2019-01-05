const fs = require("fs");
const path = require("path");
const streamlines = require("@anvaka/streamlines");
const { createCanvas } = require("canvas");

global.window = {
  performance: require("perf_hooks").performance
};

const queue = [
  "2018010100.json",
  "2018010106.json",
  "2018010112.json",
  "2018010118.json",
  "2018010200.json",
  "2018010206.json",
  "2018010212.json",
  "2018010218.json",
  "2018010300.json",
  "2018010306.json",
  "2018010312.json",
  "2018010318.json",
  "2018010400.json",
  "2018010406.json",
  "2018010412.json",
  "2018010418.json",
  "2018010500.json",
  "2018010506.json",
  "2018010512.json",
  "2018010518.json",
  "2018010600.json",
  "2018010606.json",
  "2018010612.json",
  "2018010618.json",
  "2018010700.json",
  "2018010706.json",
  "2018010712.json",
  "2018010718.json",
  "2018010800.json",
  "2018010806.json",
  "2018010812.json",
  "2018010818.json",
  "2018010900.json",
  "2018010906.json",
  "2018010912.json",
  "2018010918.json",
  "2018011000.json",
  "2018011006.json",
  "2018011012.json",
  "2018011018.json",
  "2018011100.json",
  "2018011106.json",
  "2018011112.json",
  "2018011118.json",
  "2018011200.json",
  "2018011206.json",
  "2018011212.json",
  "2018011218.json",
  "2018011300.json",
  "2018011306.json",
  "2018011312.json",
  "2018011318.json",
  "2018011400.json",
  "2018011406.json",
  "2018011412.json",
  "2018011418.json",
  "2018011500.json",
  "2018011506.json",
  "2018011512.json",
  "2018011518.json",
  "2018011600.json",
  "2018011606.json",
  "2018011612.json",
  "2018011618.json",
  "2018011700.json",
  "2018011706.json",
  "2018011712.json",
  "2018011718.json",
  "2018011800.json",
  "2018011806.json",
  "2018011812.json",
  "2018011818.json",
  "2018011900.json",
  "2018011906.json",
  "2018011912.json",
  "2018011918.json",
  "2018012000.json",
  "2018012006.json",
  "2018012012.json",
  "2018012018.json",
  "2018012100.json",
  "2018012106.json",
  "2018012112.json",
  "2018012118.json",
  "2018012200.json",
  "2018012206.json",
  "2018012212.json",
  "2018012218.json",
  "2018012300.json",
  "2018012306.json",
  "2018012312.json",
  "2018012318.json",
  "2018012400.json",
  "2018012406.json",
  "2018012412.json",
  "2018012418.json",
  "2018012500.json",
  "2018012506.json",
  "2018012512.json",
  "2018012518.json",
  "2018012600.json",
  "2018012606.json",
  "2018012612.json",
  "2018012618.json",
  "2018012700.json",
  "2018012706.json",
  "2018012712.json",
  "2018012718.json",
  "2018012800.json",
  "2018012806.json",
  "2018012812.json",
  "2018012818.json",
  "2018012900.json",
  "2018012906.json",
  "2018012912.json",
  "2018012918.json",
  "2018013000.json",
  "2018013006.json",
  "2018013012.json",
  "2018013018.json",
  "2018013100.json",
  "2018013106.json",
  "2018013112.json",
  "2018013118.json",
  "2018020100.json",
  "2018020106.json",
  "2018020112.json",
  "2018020118.json",
  "2018020200.json",
  "2018020206.json",
  "2018020212.json",
  "2018020218.json",
  "2018020300.json",
  "2018020306.json",
  "2018020312.json",
  "2018020318.json",
  "2018020400.json",
  "2018020406.json",
  "2018020412.json",
  "2018020418.json",
  "2018020500.json",
  "2018020506.json",
  "2018020512.json",
  "2018020518.json",
  "2018020600.json",
  "2018020606.json",
  "2018020612.json",
  "2018020618.json",
  "2018020700.json",
  "2018020706.json",
  "2018020712.json",
  "2018020718.json",
  "2018020800.json",
  "2018020806.json",
  "2018020812.json",
  "2018020818.json",
  "2018020900.json",
  "2018020906.json",
  "2018020912.json",
  "2018020918.json",
  "2018021000.json",
  "2018021006.json",
  "2018021012.json",
  "2018021018.json",
  "2018021100.json",
  "2018021106.json",
  "2018021112.json",
  "2018021118.json",
  "2018021200.json",
  "2018021206.json",
  "2018021212.json",
  "2018021218.json",
  "2018021300.json",
  "2018021306.json",
  "2018021312.json",
  "2018021318.json",
  "2018021400.json",
  "2018021406.json",
  "2018021412.json",
  "2018021418.json",
  "2018021500.json",
  "2018021506.json",
  "2018021512.json",
  "2018021518.json",
  "2018021600.json",
  "2018021606.json",
  "2018021612.json",
  "2018021618.json",
  "2018021700.json",
  "2018021706.json",
  "2018021712.json",
  "2018021718.json",
  "2018021800.json",
  "2018021806.json",
  "2018021812.json",
  "2018021818.json",
  "2018021900.json",
  "2018021906.json",
  "2018021912.json",
  "2018021918.json",
  "2018022000.json",
  "2018022006.json",
  "2018022012.json",
  "2018022018.json",
  "2018022100.json",
  "2018022106.json",
  "2018022112.json",
  "2018022118.json",
  "2018022200.json",
  "2018022206.json",
  "2018022212.json",
  "2018022218.json",
  "2018022300.json",
  "2018022306.json",
  "2018022312.json",
  "2018022318.json",
  "2018022400.json",
  "2018022406.json",
  "2018022412.json",
  "2018022418.json",
  "2018022500.json",
  "2018022506.json",
  "2018022512.json",
  "2018022518.json",
  "2018022600.json",
  "2018022606.json",
  "2018022612.json",
  "2018022618.json",
  "2018022700.json",
  "2018022706.json",
  "2018022712.json",
  "2018022718.json",
  "2018022800.json",
  "2018022806.json",
  "2018022812.json",
  "2018022818.json",
  "2018030100.json",
  "2018030106.json",
  "2018030112.json",
  "2018030118.json",
  "2018030200.json",
  "2018030206.json",
  "2018030212.json",
  "2018030218.json",
  "2018030300.json",
  "2018030306.json",
  "2018030312.json",
  "2018030318.json",
  "2018030400.json",
  "2018030406.json",
  "2018030412.json",
  "2018030418.json",
  "2018030500.json",
  "2018030506.json",
  "2018030512.json",
  "2018030518.json",
  "2018030600.json"
];
processNextInQueue();

function processNextInQueue() {
  if (!queue.length) return;
  var item = queue.shift();
  processItem(item).then(processNextInQueue);
}

function processItem(item) {
  console.log("processing ", item);

  const canvasWidth = 1280;
  const canvasHeight = 694;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");
  const data = require("./" + path.join("data", item));
  const u = data.u;
  const v = data.v;

  var uMax = u.maximum;
  var uMin = u.minimum;
  var vMax = v.maximum;
  var vMin = v.minimum;
  var maxVelocity = Math.sqrt(uMax * uMax + vMax * vMax);
  const width = u.Ni;
  const height = u.Nj - 1;
  const vfData = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const k = y * width + ((x + width / 2) % width);
      // vfData[i + 0] = (u.values[k] - u.minimum) / (u.maximum - u.minimum);
      // vfData[i + 1] = (v.values[k] - v.minimum) / (v.maximum - v.minimum);
      vfData[i + 0] = Math.floor(
        (255 * (u.values[k] - u.minimum)) / (u.maximum - u.minimum)
      );
      vfData[i + 1] = Math.floor(
        (255 * (v.values[k] - v.minimum)) / (v.maximum - v.minimum)
      );
      vfData[i + 2] = 0;
      vfData[i + 3] = 255;
    }
  }

  const boundingBox = {
    left: 0,
    top: 0,
    width: width,
    height: height
  };

  return streamlines({
    dSep: 0.5,
    dTest: 0.25,
    boundingBox: boundingBox,
    vectorField: vectorField,
    timeStep: 0.9,
    maxTimePerIteration: 1000000,
    stepsPerIteration: 4000000,
    onStreamlineAdded: onStreamlineAdded,
    seed: {
      x: 10,
      y: 10
    }
  })
    .run()
    .then(saveCanvas);

  function vectorField(p) {
    // We will be using interpolation, as described by https://blog.mapbox.com/how-i-built-a-wind-map-with-webgl-b63022b5537f
    var lx = Math.floor(p.x);
    var ly = Math.floor(p.y);
    var ux = Math.ceil(p.x);
    var uy = Math.ceil(p.y);

    if (lx < 0) lx = ux;
    if (ux >= width) ux = lx;
    if (ly < 0) ly = uy;
    if (uy > height) uy = ly;
    if (outside(lx, ly) || outside(ux, uy)) return;

    var tl = getXY(lx, ly);
    var tr = getXY(lx + 1, ly);
    var bl = getXY(lx, ly + 1);
    var br = getXY(lx + 1, ly + 1);

    if (!tl || !tr || !bl || !br) return;

    // use interpolation to get better details in the mid points.
    var res = mix(mix(tl, tr, p.x - lx), mix(bl, br, p.x - lx), 1 - p.y + ly);
    var p = {
      // I don't really know why we need minus. This way it matches the original wind map by Vladimir Agafonkin
      x: -(res.x * (uMax - uMin) + uMin),
      y: res.y * (vMax - vMin) + vMin
    };

    return p;
  }

  // Given vector field coordinates - read value from the wind texture.
  function getXY(x, y) {
    if (outside(x, y)) return;

    var idx = (x + y * width) * 4;
    return {
      x: vfData[idx] / 255,
      y: vfData[idx + 1] / 255
    };
  }

  // Checks if a point is outside of the visible area.
  function outside(x, y) {
    return x < 0 || x >= width || y < 0 || y >= height;
  }

  // Linear interpolation between two points
  function mix(a, b, ratio) {
    return {
      x: a.x * ratio + (1 - ratio) * b.x,
      y: a.y * ratio + (1 - ratio) * b.y
    };
  }

  function onStreamlineAdded(points) {
    for (var i = 1; i < points.length; ++i) {
      drawSegment(points[i - 1], points[i]);
    }
  }

  function drawSegment(a, b) {
    ctx.beginPath();
    // get color in the middle of the vector.
    ctx.strokeStyle = getColor((a.x + b.x) * 0.5, (a.y + b.y) * 0.5);
    a = transform(a);
    b = transform(b);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.closePath();
  }

  // Turns vector field point into canvas point.
  function transform(pt) {
    var tx = (pt.x - boundingBox.left) / boundingBox.width;
    var ty = (pt.y - boundingBox.top) / boundingBox.height;

    return {
      x: Math.round(tx * canvasWidth),
      y: Math.round(ty * canvasHeight)
    };
  }

  function getColor(x, y) {
    var p = vectorField({ x, y });
    if (!p) return "rgba(0, 0, 0, 1.)";
    var gray = Math.sqrt(p.x * p.x + p.y * p.y) / maxVelocity;
    var c = gradient(gray);
    return (
      "rgba(" + c.r + ", " + c.g + "," + c.b + ", " + (0.2 + gray * 1.2) + ")"
    );
  }

  function gradient(c) {
    return {
      r: Math.round(255 * c),
      g: Math.round(255 * c),
      b: Math.round(255 * c)
    };
  }

  function saveCanvas() {
    canvas
      .createPNGStream()
      .pipe(fs.createWriteStream(path.join("out", item + ".png")));
  }
}
