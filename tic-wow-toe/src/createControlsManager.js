import eventify from 'ngraph.events';
import queryState from 'query-state';
import copyTextToClipboard from './utils/copyToClipboard.js';

/**
 * Controls manager is a simple wrapper that handles control button clicks
 */
export default function createControlsManager(container, board, renderer) {
  container.querySelector('#clear').addEventListener('click', onClearClick);
  container.querySelector('#copy').addEventListener('click', onCopyClick);
  container.querySelector('#hide-info').addEventListener('click', onHideInfoClick);

  container.getElementById('in-a-row').value = board.winLength;
  container.getElementById('board-width').value = board.width;
  container.getElementById('board-height').value = board.height;
  Array.from(container.querySelectorAll('.auto-size')).forEach(el => {
    createAutoSizeInput(el);
  });
  renderNextMoveSymbol();
  board.on('change', renderNextMoveSymbol);

  let api = eventify({});
  container.getElementById('board-width').addEventListener('change', onBoardWidthChanged);
  container.getElementById('board-height').addEventListener('change', onBoardHeightChanged);
  container.getElementById('in-a-row').addEventListener('change', onWinLengthChanged);

  let infoHidden = queryState.instance().get('ui') === 0;
  updateToggleUIIndicator();
  return api;

  function onHideInfoClick(e) {
    infoHidden = !infoHidden;
    queryState.instance().set('ui', infoHidden ? 0 : 1);
    updateToggleUIIndicator();
  }

  function updateToggleUIIndicator() {
    container.querySelector('#hide-info').innerText = infoHidden ? 'Show info' : 'Hide info';
    container.querySelector('.info').style.display = infoHidden ? 'none' : 'block';
  }

  function onBoardWidthChanged(e) {
    let width = parseInt(e.target.value, 10);
    if (width > 2) {
      api.fire('resize', width, board.height);
    } 
  }

  function onBoardHeightChanged(e) {
    let height = parseInt(e.target.value, 10);
    if (height > 2) {
      api.fire('resize', board.width, height);
    }
  }

  function onWinLengthChanged(e) {
    let winLength = parseInt(e.target.value, 10);
    if (winLength > 2) {
      api.fire('win-condition-change', winLength);
    }
  }

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

function createAutoSizeInput(el) {
  let measuringSpan = document.createElement('span');
  measuringSpan.style.visibility = 'hidden';
  measuringSpan.style.position = 'absolute';
  measuringSpan.style.top = '-9999px';
  measuringSpan.style.left = '-9999px';
  measuringSpan.style.width = 'auto';
  measuringSpan.style.height = 'auto';
  measuringSpan.style.whiteSpace = 'nowrap';

  let style = window.getComputedStyle(el);
  measuringSpan.style.fontFamily = style.fontFamily;
  measuringSpan.style.fontSize = style.fontSize;
  document.body.appendChild(measuringSpan);

  el.addEventListener('change', onInputChanged);
  el.addEventListener('keydown', onInputChanged);
  el.addEventListener('keyup', onInputChanged);
  onInputChanged({target: el});

  function onInputChanged(e) {
    measuringSpan.innerText = e.target.value;
    el.style.width = measuringSpan.offsetWidth + 'px';
  }
}