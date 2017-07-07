module.exports = pipeline;

function pipeline(steps) {
  return run 

  function run(args) {
    return next(args, 0);
  }

  function next(args, idx) {
    if (idx < steps.length) {
      return Promise.resolve(steps[idx](args))
        .then(res => next(res, idx + 1))
    }

    return Promise.resolve(args);
  }
}
