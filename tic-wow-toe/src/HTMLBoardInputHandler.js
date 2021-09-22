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
    container.addEventListener('mousemove', this.onMouseMove);
    container.addEventListener('click', this.onClick);
    container.addEventListener('keydown', this.onKeyDown);

    this.gameCursor = new GameCursor(gameBoard);
  }

  dispose() {
    const {container} =  this.gameBoard;
    container.removeEventListener('mousemove', this.onMouseMove);
    container.removeEventListener('click', this.onClick);
    container.removeEventListener('keydown', this.onKeyDown);
  }

  onKeyDown(e) {
    if (e.metaKey || e.ctrlKey) return; // if command key is down - ignore

    if (e.keyCode === 32 || e.keyCode === 13) { // space or enter
      this.gameBoard.play(this.gameCursor.lastX, this.gameCursor.lastY);
      e.preventDefault();
    } else if (e.keyCode === 37 || e.keyCode === 65 || e.keyCode === 72) { // left or A or H
      this.gameCursor.renderAt(this.gameCursor.lastX - 1, this.gameCursor.lastY);
      e.preventDefault();
    } else if (e.keyCode === 38 || e.keyCode === 87 || e.keyCode === 75) { // up or W or K
      this.gameCursor.renderAt(this.gameCursor.lastX, this.gameCursor.lastY - 1);
      e.preventDefault();
    } else if (e.keyCode === 39 || e.keyCode === 68 || e.keyCode === 76) { // right or D or L
      this.gameCursor.renderAt(this.gameCursor.lastX + 1, this.gameCursor.lastY);
      e.preventDefault();
    } else if (e.keyCode === 40 || e.keyCode === 83 || e.keyCode === 74) { // down or S or J
      this.gameCursor.renderAt(this.gameCursor.lastX, this.gameCursor.lastY + 1);
      e.preventDefault();
    } else if (e.keyCode === 48) { // 0 - vim for the start of line
      this.gameCursor.renderAt(0, this.gameCursor.lastY);
      e.preventDefault();
    } else if (e.keyCode === 52) { // $ - vim for the end of line
      this.gameCursor.renderAt(this.gameBoard.board.width - 1, this.gameCursor.lastY);
      e.preventDefault();
    }
  }

  onMouseMove(e) {
    let { x, y } = this.getCellPosition(e);
    this.gameCursor.renderAt(x, y);
  }

  onClick(e) {
    e.preventDefault();
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