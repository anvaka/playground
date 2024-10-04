const MaxLineSegments = 10000;

const JANUARY = 1;
const DECEMBER = 12;

const lineColor = 0xffffff06; // this is rgba(255, 255, 255, 0.06)
const PI_2 = Math.PI * 2;

function makeBirthdayFunction(month = 6, day = 29) {
  return function f(x) {
    return x/(month + 1) + Math.cos(x*day);
  }
}

const canvas = document.querySelector('canvas');
// const ctx = canvas.getContext('2d');
const sceneWidth = canvas.width = window.innerWidth;
const sceneHeight = canvas.height = window.innerHeight;
// Scene needs a canvas element
const {createScene, LineStripCollection} = wgl;

let scene = createScene(canvas);
scene.setClearColor(0x1b/0xff, 0x29/0xff, 0x4a/0xff, 1.)


// Lets bring the grid into the view:
scene.setViewBox({
  left: 0,
  top: canvas.height * 2,
  right: canvas.width * 2,
  bottom: 0 
})

renderScene();
document.querySelector('.loader').style.display = 'none';

function renderScene() {
  const blockHeightPerMonth = 4 * 1024 / 12;
  const blockWidthPerDay = 8 * 1024 / 31;

  for (let month = JANUARY; month <= DECEMBER; month++) {
    for (let day = 1; day <= dayInMonth(month); day++) {
      console.log('rendering month', month, 'day', day);
      const f = makeBirthdayFunction(month, day);
      let startX = (day - 1) * blockWidthPerDay;
      let startY = (month - 1) * blockHeightPerMonth;
      let endX = day * blockWidthPerDay;
      let endY = month * blockHeightPerMonth;
      renderFunction(f, startX, startY, endX, endY);
    }
  }
}

function dayInMonth(month) {
  if (month === 2) {
    return 29; // leap year
  }
  if (month === 4 || month === 6 || month === 9 || month === 11) {
    return 30;
  }
  return 31;
}

function renderFunction(f, startX, startY, endX, endY) {
  let functionDimensions = measureFunction(f, MaxLineSegments); 
  const scaleX = (endX - startX) / (functionDimensions.maxX - functionDimensions.minX);
  const scaleY = (endY - startY) / (functionDimensions.maxY - functionDimensions.minY);

  // let's draw a grid:
  let lines = new LineStripCollection(MaxLineSegments);
  let prevPoint = {x: 0, y: 0};
  for (let i = 0; i < MaxLineSegments; i++) {
    prevPoint = getNextPoint(f, prevPoint, i);
    const canvasX = (prevPoint.x - functionDimensions.minX) * scaleX + startX;
    const canvasY = (prevPoint.y - functionDimensions.minY) * scaleY + startY;

    lines.add({
      x: canvasX, 
      y: canvasY, 
      z: 0,
      color: lineColor
    });
  }

  scene.appendChild(lines);
}

function getNextPoint(f, prevPoint, n) {
  const phi = f(n) * PI_2;
  return {
    x: prevPoint.x + Math.cos(phi), 
    y: prevPoint.y + Math.sin(phi)
  }
}

function measureFunction(f, max) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let prevPoint = {x: 0, y: 0}
  for (let i = 0; i < max; i++) {
    prevPoint = getNextPoint(f, prevPoint, i);
    minX = Math.min(minX, prevPoint.x);
    minY = Math.min(minY, prevPoint.y);
    maxX = Math.max(maxX, prevPoint.x);
    maxY = Math.max(maxY, prevPoint.y);
  }
  // make it a bit larger to fit:
  const dx = maxX - minX;
  const dy = maxY - minY;
  minX -= dx * 0.1;
  minY -= dy * 0.1;
  maxX += dx * 0.1;
  maxY += dy * 0.1;

  return {minX, minY, maxX, maxY}
}