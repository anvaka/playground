module.exports = createGridLayout;

var bus = require('../../lib/bus');
var GridLayoutSettings = require('./GridLayoutSettings.vue');

function createGridLayout(appModel) {
  let toolSettings = {
    component: GridLayoutSettings, 
    vm: createGridLayoutViewModel(appModel)
  };
  bus.fire('add-setting', toolSettings);

  return {
    dispose
  };

  function dispose() {
    bus.fire('remove-setting', toolSettings);
  }
}

function createGridLayoutViewModel(appModel) {
   var api = {
     moveToPosition
   };

   return api;

   function moveToPosition() {
     let { selectedCluster } = appModel;
     let graph = selectedCluster.graph;
     let layout = selectedCluster.layout;

     graph.forEachNode(node => {
       let pos = layout.getNodePosition(node.id);
       layout.setNodePosition(node.id, 20 * Math.round(pos.x / 20), 20 * Math.round(pos.y / 20));
     })
   }
}