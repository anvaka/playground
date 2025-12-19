/**
 * Spaced Repetition System (SM-2 algorithm)
 * 
 * Quality ratings:
 * - 1 (Again): Complete failure, couldn't recall
 * - 3 (Hard): Recalled with significant difficulty
 * - 4 (Good): Recalled with some effort (default correct)
 * - 5 (Easy): Perfect, instant recall
 */

import { saveMarkdownCard } from './markdownStorage.js'

/**
 * Quality constants for review grades
 */
export const Quality = {
  AGAIN: 1,
  HARD: 3,
  GOOD: 4,
  EASY: 5
}

/**
 * Calculate next review date as ISO string (YYYY-MM-DD)
 */
function addDays(days, fromDate = new Date()) {
  const date = new Date(fromDate)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

/**
 * SM-2 algorithm: calculate new SRS values based on review quality
 * 
 * @param {Object} card - Card with current SRS values
 * @param {number} quality - Review quality (1, 3, 4, or 5)
 * @returns {Object} Updated SRS fields
 */
export function calculateSRS(card, quality) {
  let { interval, easeFactor, repetitions, lapses } = card
  
  // Ensure defaults
  interval = interval ?? 0
  easeFactor = easeFactor ?? 2.5
  repetitions = repetitions ?? 0
  lapses = lapses ?? 0
  
  if (quality < 3) {
    // Failed: reset to beginning
    repetitions = 0
    interval = 1
    lapses += 1
  } else {
    // Passed: advance in schedule
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
    
    // Update ease factor based on quality
    // Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const qDiff = 5 - quality
    easeFactor = easeFactor + (0.1 - qDiff * (0.08 + qDiff * 0.02))
    
    // Clamp ease factor (minimum 1.3 prevents impossible cards)
    easeFactor = Math.max(1.3, easeFactor)
  }
  
  // Round ease factor to 2 decimal places
  easeFactor = Math.round(easeFactor * 100) / 100
  
  const due = addDays(interval)
  
  return { due, interval, easeFactor, repetitions, lapses }
}

/**
 * Review a card and save updated SRS values
 * 
 * @param {Object} card - Card to review
 * @param {number} quality - Review quality (use Quality constants)
 * @returns {Object} Updated card
 */
export function reviewCard(card, quality) {
  const srsUpdate = calculateSRS(card, quality)
  const updatedCard = { ...card, ...srsUpdate }
  return saveMarkdownCard(updatedCard)
}

/**
 * Preview what intervals each grade would give (for UI hints)
 * 
 * @param {Object} card - Card to preview
 * @returns {Object} Map of quality to interval in days
 */
export function previewIntervals(card) {
  return {
    [Quality.AGAIN]: calculateSRS(card, Quality.AGAIN).interval,
    [Quality.HARD]: calculateSRS(card, Quality.HARD).interval,
    [Quality.GOOD]: calculateSRS(card, Quality.GOOD).interval,
    [Quality.EASY]: calculateSRS(card, Quality.EASY).interval
  }
}

/**
 * Format interval for display
 * @param {number} days - Interval in days
 * @returns {string} Human-readable interval
 */
export function formatInterval(days) {
  if (days === 0) return 'now'
  if (days === 1) return '1d'
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.round(days / 7)}w`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${Math.round(days / 365)}y`
}
