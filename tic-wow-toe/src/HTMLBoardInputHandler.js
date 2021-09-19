class GameCursor {
  constructor(board) {
    this.board = board;

    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.style.position = 'absolute';
    cursor.style.width = (board.cellSize - 1) + 'px';
    cursor.style.height = (board.cellSize - 1)+ 'px';
    board.container.appendChild(cursor);

    this.cursor = cursor;
    this.renderAt(0, 0);
  }

  renderAt(cellX, cellY) {
    cellX = clamp(cellX, 0, this.board.board.width - 1);
    cellY = clamp(cellY, 0, this.board.board.height - 1);
    this.lastX = cellX;
    this.lastY = cellY;
    this.cursor.style.left = (cellX * this.board.cellSize + 1) + 'px';
    this.cursor.style.top =  (cellY * this.board.cellSize + 1) + 'px';
  }
}

export default class HTMLBoardInputHandler {
  constructor(gameBoard) {
    this.gameBoard = gameBoard;

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);

    const {container} =  this.gameBoard;
    container.focus();
    container.addEventListener('mousemove', this.onMouseMove);
    container.addEventListener('click', this.onClick);
    window.addEventListener('keydown', this.onKeyDown);

    this.gameCursor = new GameCursor(gameBoard);
  }

  dispose() {
    this.gameBoard.container.removeEventListener('mousemove', this.onMouseMove);
    this.gameBoard.container.removeEventListener('click', this.onClick);
    window.removeEventListener('keydown', this.onKeyDown);
  }

  onKeyDown(e) {
    if (e.keyCode === 32) { // space
      this.gameBoard.play(this.gameCursor.lastX, this.gameCursor.lastY);
    } else if (e.keyCode === 37) { // left
      this.gameCursor.renderAt(this.gameCursor.lastX - 1, this.gameCursor.lastY);
    } else if (e.keyCode === 38) { // up
      this.gameCursor.renderAt(this.gameCursor.lastX, this.gameCursor.lastY - 1);
    } else if (e.keyCode === 39) { // right
      this.gameCursor.renderAt(this.gameCursor.lastX + 1, this.gameCursor.lastY);
    } else if (e.keyCode === 40) { // down
      this.gameCursor.renderAt(this.gameCursor.lastX, this.gameCursor.lastY + 1);
    }
  }

  onMouseMove(e) {
    let { x, y } = this.getCellPosition(e);
    this.gameCursor.renderAt(x, y);
  }

  onClick(e) {
    let { x, y } = this.getCellPosition(e);
    this.gameBoard.play(x, y);
  }

  getCellPosition(e) {
    let rect = e.target.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    let cellX = clamp(Math.floor(x / this.gameBoard.cellSize), 0, this.gameBoard.board.width - 1);
    let cellY = clamp(Math.floor(y / this.gameBoard.cellSize), 0, this.gameBoard.board.height - 1);
    return { x: cellX, y: cellY };
  }
}

function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}