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
    this.cursor.style.left = (cellX * this.board.cellSize + 1) + 'px';
    this.cursor.style.top =  (cellY * this.board.cellSize + 1) + 'px';
  }
}

export default class HTMLBoardInputHandler {
  constructor(gameBoard) {
    this.gameBoard = gameBoard;

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onClick = this.onClick.bind(this);

    this.gameBoard.container.addEventListener('mousemove', this.onMouseMove);
    this.gameBoard.container.addEventListener('click', this.onClick);
    this.gameCursor = new GameCursor(gameBoard);
  }
  dispose() {
    this.gameBoard.container.removeEventListener('mousemove', this.onMouseMove);
    this.gameBoard.container.removeEventListener('click', this.onClick);
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