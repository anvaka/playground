/**
 * Entry point to the application is here.
 */
import queryState from 'query-state';

import HTMLBoardRenderer from './HTMLBoardRenderer.js';
import createControlsManager from './createControlsManager.js';
import createInitializedGameBoardFromQueryString from './createInitializedGameBoardFromQueryString.js';

// Query string is used with these default values:
const defaultQueryStringValues = {
  w: 16,   // Number of horizontal cells (width)
  h: 10,   // Number of vertical cells (height)
  s: 'XO', // Player symbols. You can add more if you want more than 2 players.
  l: 5,    // Number of same symbols in a row to win
  m: ''    // Current sequence of moves. Decoded/Encoded inside createInitializedGameBoardFromQueryString()
};

const qs = queryState.instance(defaultQueryStringValues, {useSearch: true});

let board = createInitializedGameBoardFromQueryString(qs);
let renderer = new HTMLBoardRenderer(document.getElementById('board'), board);

// final bit, let's listen to the user actions on the "Controls" strip
let controlsManager = createControlsManager(document, board, renderer);
controlsManager.on('resize', rebuildBoard);
controlsManager.on('win-condition-change', updateWinCondition);

// Just in case if someone wants to play with it via console
window.board = board;

function rebuildBoard(width, height) {
  renderer.dispose();
  board.resize(width, height);
  qs.set({
    w: width,
    h: height
  })
  renderer = new HTMLBoardRenderer(document.getElementById('board'), board);
}

function updateWinCondition(winCondition) {
  qs.set({
    l: winCondition
  });
  board.setWinCondition(winCondition);
}