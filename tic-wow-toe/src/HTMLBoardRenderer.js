import HTMLBoardInputHandler from './HTMLBoardInputHandler.js';

export default class HTMLBoardRenderer {
  constructor(container, board) {
    this.container = container;
    this.board = board;
    let widthToFit = Math.max(36, (window.innerWidth / board.width));
    this.cellSize = Math.min(42, widthToFit);
    this.boardColor = '#333';
    this.renderBackground();

    this.inputHandler = new HTMLBoardInputHandler(this);
    this.renderedPositions = new Map();
    this.renderPositions();

    board.on('play', this.renderPositions, this);
    board.on('remove', this.removePosition, this);
    board.on('clear', this.clear, this);
    let lastMove = document.querySelector('.last-move');
    if (lastMove) lastMove.scrollIntoView();
  }

  dispose() {
    this.container.innerText = '';
    this.board.off('play', this.renderPositions);
    this.board.off('remove', this.removePosition);
    this.board.off('clear', this.clear);
    this.inputHandler.dispose();
  }

  focus() {
    this.container.focus();
  }

  play(cellX, cellY) {
    let cellPos = this.board.getPosition(cellX, cellY);
    if (cellPos && cellPos === this.board.getLast()) {
      // can only undo the last move:
      this.board.removeLast();
    } else {
      this.board.play(cellX, cellY);
    }
  }

  renderBackground() {
    this.container.style.width =  (1 + this.board.width  * this.cellSize) + 'px';
    this.container.style.height = (1 + this.board.height * this.cellSize) + 'px';
    this.container.style.backgroundSize = this.cellSize + 'px ' + this.cellSize + 'px';
  }

  clear() {
    this.renderedPositions.forEach((positionElement) => {
      positionElement.parentElement.removeChild(positionElement);
    });
    this.renderedPositions.clear();
    this.renderPositions();
  }

  removePosition(position) {
    let element = this.renderedPositions.get(position);
    if (!element) return; // already removed;
    element.parentElement.removeChild(element);
    this.renderedPositions.delete(position);

    this.checkWinner();
    this.highlightLastMove();
  }

  renderPositions() {
    this.board.positions.forEach((position) => {
      if (this.renderedPositions.get(position)) return; // already rendered;
      let positionElement = createPositionElement(position, this.cellSize, this.container);
      this.renderedPositions.set(position, positionElement);
    });

    this.checkWinner();
    this.highlightLastMove();
  }

  checkWinner() {
    let winner = this.board.getWinner();
    Array.from(this.container.querySelectorAll('.winner')).forEach(x => {
      x.classList.remove('winner');
    });
    if (winner) {
      winner.sequence.forEach(([cellX, cellY]) => {
        const position = this.board.getPosition(cellX, cellY);
        this.renderedPositions.get(position).classList.add('winner');
      })
    } 
  }

  highlightLastMove() {
    Array.from(this.container.querySelectorAll('.last-move')).forEach(x => {
      x.classList.remove('last-move');
    });
    if (this.board.positions.length > 0) {
      let last = this.board.positions[this.board.positions.length - 1];
      this.renderedPositions.get(last).classList.add('last-move');
    }
  }
}

function createPositionElement(position, size, container) {
  let positionElement = document.createElement('div');
  positionElement.className = 'symbol';
  positionElement.style.width =  (size - 1) + 'px';
  positionElement.style.height = (size - 1) + 'px';
  positionElement.style.left = (1 + position.x * size) + 'px';
  positionElement.style.top =  (1 + position.y * size) + 'px';
  positionElement.style.fontSize = size + 'px';
  positionElement.style.lineHeight = size + 'px';
  positionElement.innerText = position.symbol;

  container.appendChild(positionElement);
  return positionElement;
}