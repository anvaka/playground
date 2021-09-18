/** 
const GameState = {
  width: 10,
  height: 10,
  winLength: 5,
  positions: []
};
*/

class Position {
  constructor(x, y, symbol) {
    this.x = x;
    this.y = y;
    this.symbol = symbol;
    this.lDiagonalChecked = false;
    this.rDiagonalChecked = false;
    this.horizontalChecked = false;
    this.verticalChecked = false;
  }

  clean() {
    this.lDiagonalChecked = false;
    this.rDiagonalChecked = false;
    this.horizontalChecked = false;
    this.verticalChecked = false;
  }
}

class GameBoard {
  constructor(width, height, winLength = 5) {
    this.width = width;
    this.height = height;
    this.winLength = winLength;
    this.positions = [];
    this.lookup = Object.create(null);
  }

  play(x, y, symbol) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      throw new Error(`Invalid position ${x}, ${y}`);
    }

    const pos = new Position(x, y, symbol);

    let row = this.lookup[y];
    if (!row) this.lookup[y] = row = {};
    let col = row[x];
    if (col) {
      throw new Error(`Position ${x}, ${y} is already occupied`);
    }
    row[x] = pos;
    this.positions.push(pos);
  }

  getPosition(x, y) {
    let row = this.lookup[y];
    if (!row) return;
    return row[x];
  }

  getWinner() {
    this.cleanWinnerCheck();
    for (let pos of this.positions) {
      let sequence = 
        filterWinner(getLongestSequence(pos, this, -1, 0, 1, 0, 'horizontalChecked'), this.winLength) ||
        filterWinner(getLongestSequence(pos, this, 0, -1,  0, 1, 'verticalChecked'), this.winLength) ||
        filterWinner(getLongestSequence(pos, this, -1, -1, 1, 1, 'lDiagonalChecked'), this.winLength) ||
        filterWinner(getLongestSequence(pos, this, -1,  1, 1, -1, 'rDiagonalChecked'), this.winLength);
      if (sequence) {
        return {
          symbol: this.getPosition(sequence[0][0], sequence[0][1]).symbol,
          sequence
        }
      }
    }
  }

  cleanWinnerCheck() {
    this.positions.forEach(pos => {
      pos.clean();
    });
  }
}

module.exports = GameBoard;

function getLongestSequence(pos, board, leftDx, leftDy, rightDx, rightDy, checkName) {
  if (pos[checkName]) return; // already checked

  let minLeft = pos.x;
  let minTop = pos.y;

  let leftSymbol = board.getPosition(minLeft + leftDx, minTop + leftDy);
  pos[checkName] = true;

  while (leftSymbol && leftSymbol.symbol === pos.symbol) {
    minLeft += leftDx;
    minTop += leftDy;

    leftSymbol[checkName] = true;
    leftSymbol = board.getPosition(minLeft + leftDx, minTop + leftDy);
  }

  let maxRight = pos.x;
  let maxBottom = pos.y;
  let rightSymbol = board.getPosition(pos.x + rightDx, pos.y + rightDy);
  while (rightSymbol && rightSymbol.symbol === pos.symbol) {
    maxRight += rightDx;
    maxBottom += rightDy;
    rightSymbol[checkName] = true;
    rightSymbol = board.getPosition(maxRight + rightDx, maxBottom + rightDy);
  }

  return {minLeft, minTop, maxRight, maxBottom, dx: rightDx, dy: rightDy};
}

function filterWinner(boundingBox, consequentSymbolCountToWin) {
  if (!boundingBox) return; // No winner here.

  let {minLeft, minTop, maxRight, maxBottom, dx, dy} = boundingBox;

  let count = 0;
  winner = [];
  let ySign = maxBottom > minTop ? 1 : -1;
  let x = minLeft; let y = minTop;
  while (x != maxRight || y != maxBottom) {
    winner.push([x, y]);
    x += dx;
    y += dy;
  }
  if (minLeft !== maxRight || minTop !== maxBottom) {
    winner.push([maxRight, maxBottom]);
  }
  if (winner.length >= consequentSymbolCountToWin) {
    return winner;
  }
}