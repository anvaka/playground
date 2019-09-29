const MISSING = 4200000000; // If post didn't have score, its value is larger than this
const STRIDE = 288;

class Archive {
  constructor(data) {
    this.data = data;
    let postCount = data.length / STRIDE;
    if (Math.round(postCount) !== postCount) {
      throw new Error('Unexpected archive format');
    }
    this.postCount = postCount;
  }

  getPostValueAtBand(postId, band) {
    let value = this.data[STRIDE * postId + band];
    if (value > MISSING) return;
    return value;
  }
}

export default function getArchive() {

  return fetch('static/scores.bin').then(response => {
    return response.arrayBuffer();
  }).then(buffer => {
    let data = new Uint32Array(buffer);
    return new Archive(data);
  }).catch(e => {
    console.error('Could not download archive', e);
    debugger;
  })
}
