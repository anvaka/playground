import GameBoard from './GameBoard.js';

/**
 * Query string has a limit after which we can't send request to the server. So if our
 * encoded sequence of moves is too long, we split it into query string + hash.
 */
const MAX_QUERY_LENGTH = 512 + 256;

/**
 * This creates a GameBoard and initializes it with values from the query string.
 */
export default function createInitializedGameBoardFromQueryString(qs) {
  const board = new GameBoard(qs.get('w'), qs.get('h'), qs.get('l'), qs.get('s'));

  // first, replay the moves from the query string
  decodeMoveSequence(getMoveSequence(qs), board.width).forEach(playMoveFromQueryString);

  // then start listen to board changes and update query string as necessary:
  board.on('change', throttle(updateUrl));

  return board;

  function updateUrl() {
    let sequence = encodeMoveSequence(board.positions, board.width);
    qs.set('m', sequence.mainQuery);
    if (sequence.overflow) {
      window.location.hash = '#o=' + sequence.overflow;
    } else {
      window.location.hash = '';
    }
  }

  function playMoveFromQueryString(m) {
    try {
      board.play(m[0], m[1]);
    } catch (e) {
      // Query string could not be related to have a valid move.
      console.error(e.message);
    }
  }
}

function decodeMoveSequence(encodedSequence, w) {
  if (encodedSequence === '')
    return [];

  try {
    return ('' + encodedSequence).split('_').map(encodedPoint => {
      let absoluteAddress = Number.parseInt(encodedPoint, 36);
      let row = Math.floor(absoluteAddress / w);
      let col = absoluteAddress % w;
      return [row, col];
    });
  } catch (e) {
    console.error('Failed to decode sequence', e);
    return [];
  }
}

function encodeMoveSequence(moves, width) {
  let mainQuery = moves.map(p => (p.x * width + p.y).toString(36)).join('_');
  let overflow = '';
  if (mainQuery.length > MAX_QUERY_LENGTH) {
    overflow = mainQuery.slice(MAX_QUERY_LENGTH)
    mainQuery = mainQuery.slice(0, MAX_QUERY_LENGTH);
  }
  return {mainQuery, overflow};
}

function getMoveSequence(qs) {
  let sequence = qs.get('m')
  if (window.location.hash.indexOf('o=') > 0) {
    sequence += window.location.hash.slice(window.location.hash.indexOf('o=') + 2);
  }
  return sequence;
}

function throttle(fn) {
  let timeout;
  return function() {
    clearTimeout(timeout);
    timeout = setTimeout(fn, 10);
  }
}