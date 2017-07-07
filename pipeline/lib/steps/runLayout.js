const createLayout = require('ngraph.forcelayout');

module.exports = runLayout

function runLayout(ctx) {
  // TODO: This should probably need a better mass
  const layout = createLayout(ctx.graph);

  for (let i = 0; i < 1000; ++i) {
    layout.step()
  }

  ctx.layout = layout

  return ctx;
}
