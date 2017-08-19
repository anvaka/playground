<template>
  <div class='graph-settings'>
    <h5>Layout Settings</h5>
    <div class='row'>
      <div class='label'>Spring length</div>
      <div class='value'><input v-model='settings.springLength'></input></div>
    </div>
    <div class='row'>
      <div class='label'>Spring Coeff</div>
      <div class='value'><input v-model='settings.springCoeff'></input></div>
    </div>
    <div class='row'>
      <div class='label'>Gravity</div>
      <div class='value'><input v-model='settings.gravity'></input></div>
    </div>
    <div class='row'>
      <div class='label'>Theta</div>
      <div class='value'><input v-model='settings.theta'></input></div>
    </div>
    <div class='row'>
      <div class='label'>Drag coefficient</div>
      <div class='value'><input v-model='settings.dragCoeff'></input></div>
    </div>
    <div class='row'>
      <div class='label'>Time step</div>
      <div class='value'><input v-model='settings.timeStep'></input></div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['settings']
}
</script>
<style>
.graph-settings {
  position: absolute;
  background: white;
  top: 0;
  padding: 7px;
}

.row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
}

.label {
  padding-right: 8px;
}
.graph-settings h5 {
  margin: 2px;
}


</style>