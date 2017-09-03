module.exports = createGridLayout;

var GridLayoutSettings = require('./GridLayoutSettings.vue');

function createGridLayout(appModel) {
  return {
    id: 'grid-layout@v0',
    component: GridLayoutSettings, 
    vm: createGridLayoutViewModel(appModel)
  };
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