export default createGridLayout;

import GridLayoutSettings from './GridLayoutSettings.vue';
import createGridLayoutViewModel from './createGridLayoutViewModel';

function createGridLayout(appModel) {
  return {
    id: 'grid-layout@v0',
    component: GridLayoutSettings, 
    vm: createGridLayoutViewModel(appModel)
  };
}
