module.exports = getGridLines;

function getGridLines(offset, bbox, cellSize) {
  let cols = Math.ceil(bbox.width/cellSize);
  let rows = Math.ceil(bbox.height/cellSize);

  let startX = Math.round((offset.x - bbox.width/2) / cellSize) * cellSize;
  let startY = Math.round((offset.y - bbox.height/2) / cellSize) * cellSize;

  let lines = [];

  for(let j = 0; j < cols; ++j) {
    lines.push({
      from: {
        x: startX + j * cellSize,
        y: startY
      }, 
      to: {
        x: startX + j * cellSize,
        y: startY + rows * cellSize
      }
    })
  }

  for(let j = 0; j < rows; ++j) {
    lines.push({
      from: {
        x: startX,
        y: startY + j * cellSize
      }, 
      to: {
        x: startX + cols * cellSize,
        y: startY + j * cellSize
      }
    })
  }

  return lines;
}