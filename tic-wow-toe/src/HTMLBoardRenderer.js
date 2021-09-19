import HTMLBoardInputHandler from './HTMLBoardInputHandler.js';

export default class HTMLBoardRenderer {
  constructor(container, board) {
    this.container = container;
    this.board = board;
    this.cellSize = 42;
    this.boardColor = '#333';
    this.renderBackground();

    this.inputHandler = new HTMLBoardInputHandler(this);
    this.renderedPositions = new Map();
    this.renderPositions();
  }

  play(cellX, cellY) {
    if (this.board.play(cellX, cellY)) {
      this.renderPositions();
    };
  }

  renderBackground() {
    this.container.style.width =  (1 + this.board.width  * this.cellSize) + 'px';
    this.container.style.height = (1 + this.board.height * this.cellSize) + 'px';
    this.container.style.backgroundSize = this.cellSize + 'px ' + this.cellSize + 'px';
  }

  renderPositions() {
    this.board.positions.forEach((position) => {
      if (this.renderedPositions.get(position)) return; // already rendered;
      let positionElement = createPositionElement(position, this.cellSize, this.container);
      this.renderedPositions.set(position, positionElement);
    });

    let winner = this.board.getWinner();
    if (winner) {
      winner.sequence.forEach(([cellX, cellY]) => {
        const position = this.board.getPosition(cellX, cellY);
        this.renderedPositions.get(position).classList.add('winner');
      })
    }
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