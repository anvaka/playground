module.exports = createGridLayout;

var GridLayoutSettings = require('./GridLayoutSettings.vue');
var createGridLayoutViewModel = require('./createGridLayoutViewModel');

function createGridLayout(appModel) {
  return {
    id: 'grid-layout@v0',
    component: GridLayoutSettings, 
    vm: createGridLayoutViewModel(appModel)
  };
}
