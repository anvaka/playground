// Created by https://twitter.com/anvaka
let height = 400;
let width = 400;
let drawingAreaPadding = 20;
let clockCount = 11; // N x N matrix

// these are internal variables to share state. No need to mess with them
let clockWall, controlPanel;
let shouldRun = false;
let autoIncrement = false;
let chosenClock; // Added to keep track of the chosen clock

/**
 * Clock class renders a single instance of clocks. It also supports
 * simple animation from current time to a given target time.
 */
class Clock {
  constructor(x, y, r, hh, mm) {
    this.circleRadius = r;
    this.hoursHandRadius = r * 0.6;
    this.minutesHandRadius = r;

    this.x = x + r;
    this.y = y + r;

    let time = new Date(2020, 9, 1, hh, mm);
    this.time = time;
    this.target = time;
    this.durationInFrames = 1;// + random() * 5;
    this.t = this.durationInFrames;
    this.from = +this.time;
    this.diff = 0;
    // if clock is chosen it is not updated with others
    this.chosen = false;

    // Added properties to store hand angles and end points
    this.hoursAngle = 0;
    this.minutesAngle = 0;
    this.minutesHandEndX = 0;
    this.minutesHandEndY = 0;
  }

  animateToTarget() {
    if (this.t > this.durationInFrames) return;
    this.t += 1;
    let t = easing(this.t / this.durationInFrames);

    let newTime = this.diff * t + this.from;
    this.time = new Date(newTime);
  }

  setTarget(newTarget) {
    if (newTarget - this.target == 0) return; // already there

    this.t = 0;
    this.from = +this.time;
    this.target = newTarget;
    this.diff = this.target - this.time;
  }

  advance() {
    this.time.setMinutes(this.time.getMinutes() + 1);
  }

  render() {
    let hours = this.time.getHours() % 12;
    let minutes = this.time.getMinutes();

    let singleHourAngle = 2 * PI / 12;
    let hAngle = singleHourAngle * (hours + minutes / 60) - PI / 2;
    this.hoursAngle = hAngle; // Store the hours hand angle

    let mAngle = 2 * PI * minutes / 60 - PI / 2;
    this.minutesAngle = mAngle; // Store the minutes hand angle

    // clock's chrome
    if (this.chosen) {
      fill(0xBF, 0x21, 0x72);
      stroke(255 , 33, 255);
    } else {
      fill(255);
      stroke(255 , 255, 255);
    } 

    // Uncomment if you want to draw clock face
    // circle(this.x, this.y, 2 * this.circleRadius);

    // hours hand
    line(
      this.x,
      this.y,
      this.x + this.hoursHandRadius * cos(hAngle),
      this.y + this.hoursHandRadius * sin(hAngle)
    );

    // minutes hand
    let mEndX = this.x + this.minutesHandRadius * cos(mAngle);
    let mEndY = this.y + this.minutesHandRadius * sin(mAngle);
    line(this.x, this.y, mEndX, mEndY);

    // Store the end point of the minutes hand
    this.minutesHandEndX = mEndX;
    this.minutesHandEndY = mEndY;
  }
}

class ControlPanel {
  constructor(x, y) {
    let r = 20;
    this.x = x;
    this.y = y;
    this.r = r;

    let run = createButton('Run');
    run.position(x + 10, y + 100);
    run.mousePressed(() => shouldRun = true);

    let randomize = createButton('Randomize times');
    randomize.position(x + 64, y + 100);
    randomize.mousePressed(createNewWall);

    let checkbox = createCheckbox('advance time', false);
    checkbox.position(this.x + this.r * 2, y + 70);
    checkbox.changed(() => autoIncrement = !autoIncrement);

    this.normal = new Clock(x, y, r, 10, 10);
    this.chosen = new Clock(x, y + r * 2, r, 10, 10);
    this.chosen.chosen = true;
  }

  render() {
    fill(255)
    text('Shows average time from neighbors', this.x + 2 * this.r + 4, this.y + this.r + 6);
    text('Shows its own time', this.x + this.r * 2 + 4, this.y + 3 * this.r + 6);
    this.normal.render();
    this.chosen.render();
  }
}

function easing(x) {
  return x; // Linear easing
}

function setup() {
  createNewWall();
  controlPanel = new ControlPanel(width + drawingAreaPadding, drawingAreaPadding);
  // 2 * width because we want to render clocks on the legend too
  createCanvas(2 * width, height);
}

function createNewWall() {
  shouldRun = false;
  clockWall = [];
  chosenClock = null;
  let rowWidth = (width - 2 * drawingAreaPadding) / clockCount;
  let colHeight = (height - 2 * drawingAreaPadding) / clockCount;
  let clockR = min(rowWidth, colHeight) / 2;
  for (let row = 0; row < clockCount; ++row) {
    let clockRow = [];
    for (let col = 0; col < clockCount; ++col) {
      let x = drawingAreaPadding + col * rowWidth;
      let y = drawingAreaPadding + row * colHeight;
      let c = new Clock(x, y, clockR, random() * 12, random() * 60);
      clockRow.push(c);
      if (random() < 0.01 && !chosenClock) {
        // Randomly select a chosen clock
        c.chosen = true;
        chosenClock = c; // Keep track of the chosen clock
      }
    }
    clockWall.push(clockRow);
  }
  if (!chosenClock) {
  let midIndex = floor(clockWall.length /2);
  chosenClock = clockWall[midIndex][midIndex];
  chosenClock.chosen = true;
  }
}

function draw() {
  background(10, 40, 50);
  fill(255)

  clockWall.forEach((row, rowNumber) => {
    row.forEach((clock, colNumber) => {
      if (shouldRun) {
        updateClockTarget(clock, rowNumber, colNumber);
        clock.animateToTarget();
      }
      clock.render();
    });
  });

  // Draw Bezier curves connecting each clock to the chosen clock
  clockWall.forEach((row) => {
    row.forEach((clock) => {
      if (clock === chosenClock) {
        // Skip the chosen clock
        return;
      }
      drawBezierBetweenClocks(clock, chosenClock);
    });
  });

  controlPanel.render();
}

function drawBezierBetweenClocks(clock1, clock2) {
  let startX = clock1.x; 
  let startY = clock1.y; 
  let endX = clock2.x;
  let endY = clock2.y;

  // Control points based on minutes hand angle and smoothly varying function of hours
  let mAngle1 = clock1.minutesAngle;
  let hAngle1 = clock1.hoursAngle;
  let controlDist1 = 3 * clock1.circleRadius * (1 + cos(hAngle1));
  let controlX1 = startX + controlDist1 * cos(mAngle1);
  let controlY1 = startY + controlDist1 * sin(mAngle1);

  let mAngle2 = clock2.minutesAngle;
  let hAngle2 = clock2.hoursAngle;
  let controlDist2 = 3 * clock2.circleRadius * (1 + cos(hAngle2));
  let controlX2 = endX + controlDist2 * cos(mAngle2);
  let controlY2 = endY + controlDist2 * sin(mAngle2);

  noFill();
  stroke(255, 100); // Semi-transparent white
  bezier(startX, startY, controlX1, controlY1, controlX2, controlY2, endX, endY);
}

function updateClockTarget(clock, row, col) {
  if (clock.chosen) {
    if (autoIncrement) clock.advance();
    return;
  }

  let allMinutes = [
    getRowColumnTime(row - 1, col), // north
    getRowColumnTime(row + 1, col), // south
    getRowColumnTime(row, col - 1), // west
    getRowColumnTime(row, col + 1), // east

    getRowColumnTime(row - 1, col - 1),
    getRowColumnTime(row - 1, col + 1),
    getRowColumnTime(row + 1, col - 1),
    getRowColumnTime(row + 1, col + 1)
  ].filter(x => x !== undefined);
  let avg = round(allMinutes.reduce((prev, cur) => prev + cur, 0) / allMinutes.length);

  clock.setTarget(new Date(Math.floor(avg)));
}

function getRowColumnTime(row, col) {
  if (row < 0 || row > clockCount - 1 ||
    col < 0 || col > clockCount - 1) return;
  return +clockWall[row][col].time;
}
