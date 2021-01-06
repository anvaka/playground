/**
 * this one renders each day as a square, over 90 years of time
 * https://editor.p5js.org/anvaka/sketches/mhbFQuxQI
 */
let yearsToShow = 90;
let daysCount = yearsToShow * 365;
let rowCount = yearsToShow * 5;
let colCount = 365 / 5;
let pixelsPerRow = 8;
let pixelsPerCol = 8;
let dateOfBirth = new Date('1984 Nov 01');
let gridWidth = pixelsPerCol * colCount;
let gridHeight = pixelsPerRow * rowCount;

function setup() {
  createCanvas(gridWidth + 80, gridHeight);
}

function draw() {
  background(220);

  let elapsed = Math.floor((new Date() - dateOfBirth) / 86400000)
  fill(55, 55, 55);
  for (let i = 0; i < elapsed; ++i) {
    let x = i % colCount;
    let y = floor(i / colCount);
    rect(
      x * pixelsPerCol,
      y * pixelsPerRow,
      pixelsPerCol, pixelsPerRow)
  }
  for (let row = 0; row <= rowCount; ++row) {
    if (row % 5 === 0) {
      
      text(row / 5, gridWidth + 5, row * pixelsPerRow);
      strokeWeight(2)
      
    } else {
      strokeWeight(1)
    }
    line(0, row * pixelsPerRow, gridWidth, row * pixelsPerRow);
  }
  for (let col = 0; col <= colCount; ++col) {
    line(col * pixelsPerCol, 0, col * pixelsPerCol, gridHeight);
  }

  noLoop()
}
