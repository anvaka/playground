export default class TensorField {
  constructor() {
    this.tensor = null;
    this.tensors = [];
  }

  addTensor(tensor) {
    this.tensors.push(tensor)
  }
}