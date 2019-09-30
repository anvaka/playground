import Archive from './Archive';

export default function fetchArchive() {
  return fetch('static/scores.bin')
    .then(response => response.arrayBuffer())
    .then(buffer => new Archive(new Uint32Array(buffer)))
}
