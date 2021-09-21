import createQueryState from 'query-state';

import GameBoard from './GameBoard.js';
import HTMLBoardRenderer from './HTMLBoardRenderer.js';
import copyTextToClipboard from './utils/copyToClipboard.js';

function createPointTransformer(svg) {
  let p = svg.parentElement.createSVGPoint()

  return function (x, y) {
    p.x = x;
    p.y = y;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
}
let qs = createQueryState({w: 16, h: 16, s: 'XO', l: 5, m:''}, {useSearch: true});

let width = qs.get('w');
let height = qs.get('h');
let board = new GameBoard(width, height, qs.get('l'), qs.get('s'));
let nextMove = document.getElementById('next-move');

document.getElementById('in-a-row').innerText = qs.get('l');

decodeMovesSequence(qs.get('m'), width).forEach(m => {
  try {
    board.play(m[0], m[1])
  } catch(e) {
    console.error(e.message)
  }
});
board.on('play', onBoardChanged);
board.on('remove', onBoardChanged);
board.on('clear', onBoardChanged);

renderNextMoveSymbol();

let renderer = new HTMLBoardRenderer(document.getElementById('board'), board);

document.querySelector('#clear').addEventListener('click', (e) => {
  e.preventDefault();
  board.clear();
  renderer.focus();
});
document.querySelector('#copy').addEventListener('click', (e) => {
  e.preventDefault();

  copyTextToClipboard(window.location.href).then(() => {
    temporaryText(document.querySelector('#copy'), 'Copied!');
  }).catch(() => {
    temporaryText(document.querySelector('#copy'), 'Failed to copy');
  })
});

function decodeMovesSequence(encodedSequence, w) {
  if (encodedSequence === '') return [];

  try {
    return ('' + encodedSequence).split('_').map(encodedPoint => {
      let absoluteAddress = Number.parseInt(encodedPoint, 36)
      let row = Math.floor(absoluteAddress / w)
      let col = absoluteAddress % w;
      return [row, col];
    });
  } catch (e) {
    console.error('Failed to decode sequence', e);
    return [];
  }

}

function onBoardChanged() {
  updateUrl();
  renderNextMoveSymbol();
}

function renderNextMoveSymbol() {
  nextMove.innerText = board.nextMoveSymbol();
}

function updateUrl() {
  let moveSequence = board.positions.map(p => (p.x * width + p.y).toString(36)).join('_');
  qs.set('m', moveSequence);
}


function temporaryText(el, text) {
  let prevText = el.innerText;
  el.innerText = text;
  setTimeout(() => {
    el.innerText = prevText;
  }, 500);
}