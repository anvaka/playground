import Archive from './Archive';
import splitTestTrain from './splitTestTrain';

export default function fetchArchive() {
  return fetch('static/scores.bin')
    .then(response => response.arrayBuffer())
    .then(buffer => {
      let allPosts = new Uint32Array(buffer);
      let {trainPosts, testPosts} = splitTestTrain(0.8, allPosts);
      window.testPosts = new Archive(testPosts);
      return new Archive(trainPosts);
    });
}

