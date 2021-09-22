import copyTextToClipboard from './utils/copyToClipboard.js';

/**
 * Controls manager is a simple wrapper that handles control button clicks
 */
export default function createControlsManager(container, board, renderer) {
  container.querySelector('#clear').addEventListener('click', onClearClick);
  container.querySelector('#copy').addEventListener('click', onCopyClick);

  container.getElementById('in-a-row').innerText = board.winLength;
  container.getElementById('board-size').innerText = `${board.width}x${board.height} `
  renderNextMoveSymbol();

  function onClearClick(e) {
    e.preventDefault();
    board.clear();
    renderer.focus();
  }

  function onCopyClick(e) {
    e.preventDefault();
  
    copyTextToClipboard(window.location.href).then(() => {
      temporaryText(container.querySelector('#copy'), 'Copied!');
    }).catch(() => {
      temporaryText(container.querySelector('#copy'), 'Failed to copy');
    });
  }

  function renderNextMoveSymbol() {
    container.getElementById('next-move').innerText = board.nextMoveSymbol();
  }
}

function temporaryText(el, text) {
  const prevText = el.innerText;

  el.innerText = text;
  setTimeout(() => {
    el.innerText = prevText;
  }, 500);
}
