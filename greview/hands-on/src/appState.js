import listResults from './lib/sidebar/listResults';
import details from './lib/sidebar/detail.js'
import styles from './styleVariables';
import bus from './lib/bus';
import graphStore from './lib/graph';
import tooltip from './lib/tooltip';

bus.on('hideList', hideList);
bus.on('showList', showList);
bus.on('showDetails', showDetails);
bus.on('hideDetails', hideDetails);

const svg = document.querySelector('svg');

svg.addEventListener('click', handleClick);
svg.addEventListener('mouseover', handleMouseOver);
svg.addEventListener('mouseout', handleMouseOut);
svg.addEventListener('touchstart', handleTap);

const appState = {
  listResults,
  details,
  graphStore
};

if (window.innerWidth > styles.screenSmall) {
  showList();
}

export default appState;

function showList() {
  listResults.visible = true
}

function hideList() {
  listResults.visible = false
}

function handleTap(e) {
  let uiElement = e.target;
  let asin = getAsin(uiElement);

  if (!asin) {
    tooltip.hide();
    return;
  }

  tooltip.show(asin, uiElement);
}

function showDetails(asin) {
  details.setAsin(asin)
  details.visible = true
}

function hideDetails() {
  details.visible = false
}

function handleClick(e) {
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey ||
      e.which !== 1) {
    // we don't want to to prevent default action if keyboard modifiers are used
    return
  }
  let asin = getAsin(e.target);
  if (!asin) return;


  bus.fire('showDetails', asin)
  e.preventDefault();
}

function handleMouseOver(e) {
  let asin = getAsin(e.target);
  if (!asin) return;

  tooltip.show(asin, e.target)
}

function handleMouseOut(e) {
  let asin = getAsin(e.target)
  if (!asin) return

  tooltip.hide()
}


function getAsin(element) {
  if (element instanceof SVGImageElement) {
    let parent = element.parentElement;
    return parent.id;
  }
}
