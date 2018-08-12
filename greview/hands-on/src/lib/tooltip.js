import graphStore from './graph.js'
import bus from './bus.js'
import style from '../styleVariables.js'

// Padding from node/screen edge to the tooltip
let padding = 8

// Hover delay before we show the tooltip
let delay = 300
let tooltipWidth = 320
let tooltipHeight = style.tooltipHeight

const tooltipService = makeTooltip(document.querySelector('svg'));

export default tooltipService;

function makeTooltip(svgScene) {
  if (!svgScene) throw new Error('svg parent is required')

  let pendingTooltip
  let visible = false
  let enabled = true
  bus.on('showDetails', hide)

  return {
    show,
    hide,
    enable,
    disable
  }

  function enable() {
    enabled = true
  }

  function disable() {
    enabled = false
    hide()
  }

  function show(asin, uiElement) {
    clearIfNeeded()

    if (!asin) throw new Error('Asin is required to render a tooltip')
    if (!enabled) return

    pendingTooltip = window.setTimeout(() => showReally(asin, uiElement), delay)
  }

  function hide() {
    clearIfNeeded()
    if (visible) {
      visible = false
      graphStore.setTooltip()
    }
  }

  function clearIfNeeded() {
    if (pendingTooltip) {
      window.clearTimeout(pendingTooltip)
      pendingTooltip = 0
    }
  }

  function showReally(asin, uiElement) {
    pendingTooltip = 0
    visible = true

    let position = getPosition(uiElement)
    graphStore.setTooltip(asin, position)
    bus.fire('tooltipVisible', asin)
  }

  function getPosition(uiElement) {
    let availableRect = svgScene.getBoundingClientRect()
    let elementRect = uiElement.getBoundingClientRect()

    if (availableRect.width < style.screenSmall) {
      // if screen is too small - just show the tooltip at the bottom
      return {
        x: 0,
        y: availableRect.bottom - tooltipHeight
      }
    }

    let top = elementRect.top - availableRect.top
    let bottom = availableRect.bottom - elementRect.bottom
    let left = elementRect.left - availableRect.left
    let right = availableRect.right - elementRect.right

    var y
    var x

    if (top > bottom) {
      y = elementRect.top - padding - tooltipHeight
    } else {
      y = elementRect.bottom + padding
    }

    if (left > right) {
      x = elementRect.left - padding - tooltipWidth
    } else {
      x = elementRect.right + padding
    }

    if (y < availableRect.top) y = availableRect.top + padding
    if (y > availableRect.bottom) y = availableRect.bottom - tooltipHeight - padding

    if (x < availableRect.left) x = availableRect.left + padding
    if (x > availableRect.right) x = availableRect.right - tooltipWidth - padding

    return {x, y}
  }
}
