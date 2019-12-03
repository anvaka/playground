import createRandom from 'ngraph.random';
import Archive from './Archive';

export default function splitTestTrain(splitRatio, allPosts) {
    let random = createRandom(42);
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