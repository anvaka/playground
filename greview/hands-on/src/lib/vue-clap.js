import Vue from 'vue'

var vueClap = {}
var disposers = new Map();

vueClap.config = {
  maxSingleTouchTime: 300, // ms
  singleTapDistanceSquared: 25 // within 5px we consider it as a single tap
}

Vue.directive('clap', {
  bind() {},

  inserted(el, binding) {
    var touchStartTime
    var startPos
    var shouldPrevent = binding.modifiers.prevent

    var currentDispose = disposers.get(el);
    if (currentDispose) {
      currentDispose()
      disposers.delete(el);
    }

    var fn = binding.value;
    if (typeof fn === 'function') {
      el.addEventListener('click', invokeHandler)

      el.addEventListener('touchend', handleTouchEnd)
      el.addEventListener('touchstart', handleTouchStart)
      disposers.set(el, disposePrevHandler);
    }

    function handleTouchStart(e) {
      var touches = e.touches

      if (touches.length === 1) {
        touchStartTime = new Date()
        startPos = {
          x: e.touches[0].pageX,
          y: e.touches[0].pageY
        }
      }
    }

    function handleTouchEnd(e) {
      // multitouch - ignore
      if (e.touches.length > 1) return

      // single touch - use time diference to determine if it was a touch or
      // a swipe
      var dt = new Date() - touchStartTime

      // To long - ignore
      if (dt > vueClap.config.maxSingleTouchTime) return

      var dx = e.pageX - startPos.x
      var dy = e.pageY - startPos.y

      if (dx * dx + dy * dy < vueClap.config.singleTapDistanceSquared) {
        invokeHandler(e)
      }
    }

    function disposePrevHandler() {
      el.removeEventListener('click', invokeHandler)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('touchstart', handleTouchStart)
    }

    function invokeHandler(e) {
      fn(e)

      if (shouldPrevent) e.preventDefault()
    }
  },

  unbind(el) {
    let currentDispose = disposers.get(el);
    if (currentDispose) {
      currentDispose()
      disposers.delete(el);
    }
  }
});