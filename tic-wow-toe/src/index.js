import createQueryState from 'query-state';

import GameBoard from './GameBoard.js';
import HTMLBoardRenderer from './HTMLBoardRenderer.js';

function createPointTransformer(svg) {
  let p = svg.parentElement.createSVGPoint()

  return function (x, y) {
    p.x = x;
    p.y = y;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
}
let qs = createQueryState({w: 10, h: 10, s: 'XO', l: 5, m:''}, {useSearch: true});

let width = qs.get('w');
let height = qs.get('h');
let board = new GameBoard(width, height, qs.get('l'), qs.get('s'));
let nextMove = document.getElementById('next-move');

decodeMovesSequence(qs.get('m'), width).forEach(m => {
  try {
    board.play(m[0], m[1])
  } catch(e) {
    console.error(e.message)
  }

});

board.on('play', onPlay);
renderNextMoveSymbol();

let renderer = new HTMLBoardRenderer(document.getElementById('board'), board);

function decodeMovesSequence(encodedSequence, w) {
  if (!encodedSequence) return [];

  return encodedSequence.split('_').map(encodedPoint => {
    let absoluteAddress = Number.parseInt(encodedPoint, 32)
    let row = Math.floor(absoluteAddress / w)
    let col = absoluteAddress % w;
    return [row, col];
  });
}

function onPlay() {
  updateUrl();
  renderNextMoveSymbol();
}

function renderNextMoveSymbol() {
  nextMove.innerText = board.nextMoveSymbol();
}

function updateUrl() {
  let moveSequence = board.positions.map(p => (p.x * width + p.y).toString(32)).join('_');
  qs.set('m', moveSequence);
}