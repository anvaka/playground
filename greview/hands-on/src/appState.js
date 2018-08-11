import listResults from './lib/sidebar/listResults';
import styles from './styleVariables';
import bus from './lib/bus';

bus.on('hideList', hideList)
bus.on('showList', showList)

const appState = {
  listResults
};

export default appState;

function showList() {
  listResults.visible = true
}

function hideList() {
  listResults.visible = false
}

if (window.innerWidth > styles.screenSmall) {
  showList();
}