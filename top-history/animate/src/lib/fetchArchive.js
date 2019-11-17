import Archive from './Archive';
import createRandom from 'ngraph.random';

export default function fetchArchive() {
  let random = createRandom(42);

  return fetch('static/scores.bin')
    .then(response => response.arrayBuffer())
    .then(buffer => {
      let allPosts = new Uint32Array(buffer);
      let {trainPosts, testPosts} = splitTestTrain(0.8, allPosts);
      window.testPosts = new Archive(testPosts);
      return new Archive(trainPosts);
    });

  function splitTestTrain(splitRatio, allPosts) {
    let trainPosts = [];
    let testPosts = [];
    let stride = Archive.STRIDE;
    let postCount = allPosts.length / stride;

    for (let i = 0; i < postCount; ++i) {
      let writeTo = random.nextDouble() < splitRatio ? trainPosts : testPosts;
      for (let j = 0; j < stride; ++j) writeTo.push(allPosts[i * stride + j]);
    }

    return {trainPosts, testPosts};
  }
}

