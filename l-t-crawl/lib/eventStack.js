module.exports = createEventStack;

function createEventStack(popCallback) {
  return {
    /**
     * Pushes item into the stack. It will be automatically poped after
     * given amaount of milliseconds is passed
     */
    push
  };

  function push(item, delayInMilliseconds) {
    setTimeout(function() {
      popCallback(item);
    }, delayInMilliseconds || 0);
  }
}
