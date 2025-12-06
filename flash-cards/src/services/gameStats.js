/**
 * Game statistics service - persists scores, settings, and problem word tracking
 */

const STORAGE_KEY_STATS = 'flash-match-stats'
const STORAGE_KEY_SETTINGS = 'flash-match-settings'

// Problem words decay after this many days without a miss
const PROBLEM_DECAY_DAYS = 30

/**
 * Get default settings
 */
function getDefaultSettings() {
  return {
    audioEnabled: true,
    defaultTimeLimit: 60,
    defaultMode: 'hanzi-pinyin',
    recentSessions: []
  }
}

/**
 * Get game settings from localStorage
 * @returns {Object} Settings object
 */
export function getSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SETTINGS)
    if (stored) {
      return { ...getDefaultSettings(), ...JSON.parse(stored) }
    }
  } catch {
    // Ignore parse errors
  }
  return getDefaultSettings()
}

/**
 * Save game settings
 * @param {Object} settings - Settings to save (merged with existing)
 */
export function saveSettings(settings) {
  const current = getSettings()
  const merged = { ...current, ...settings }
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(merged))
}

/**
 * Add a recent session to settings (for quick restart)
 * @param {Object} session - { tags, mode, hidePinyin, timeLimit }
 */
export function addRecentSession(session) {
  const settings = getSettings()
  const recent = settings.recentSessions || []
  
  // Remove duplicate (same tags + mode)
  const key = `${session.tags.sort().join(',')}-${session.mode}-${session.hidePinyin}`
  const filtered = recent.filter(s => {
    const sKey = `${s.tags.sort().join(',')}-${s.mode}-${s.hidePinyin}`
    return sKey !== key
  })
  
  // Add to front, limit to 5
  filtered.unshift({
    ...session,
    lastPlayed: new Date().toISOString()
  })
  
  settings.recentSessions = filtered.slice(0, 5)
  saveSettings(settings)
}

/**
 * Get all stored statistics
 */
function getStats() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_STATS)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore parse errors
  }
  return {
    scores: [],
    problemCards: {}
  }
}

/**
 * Save statistics
 */
function saveStats(stats) {
  localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats))
}

/**
 * Record a game result
 * @param {Object} result - Game result
 * @param {string} result.mode - 'hanzi-pinyin' or 'hanzi-english'
 * @param {string[]} result.tags - Tags used in game
 * @param {boolean} result.hidePinyin - Whether pinyin was hidden
 * @param {number} result.timeLimit - Time limit in seconds
 * @param {number} result.correct - Number of correct matches
 * @param {number} result.incorrect - Number of incorrect attempts
 * @param {Array} result.matchHistory - Array of { cardId, character, wasCorrect }
 */
export function recordGameResult(result) {
  const stats = getStats()
  
  // Add score entry
  const score = {
    mode: result.mode,
    tags: result.tags.sort(),
    hidePinyin: result.hidePinyin || false,
    timeLimit: result.timeLimit,
    correct: result.correct,
    incorrect: result.incorrect,
    accuracy: result.correct / Math.max(1, result.correct + result.incorrect),
    date: new Date().toISOString()
  }
  
  stats.scores.push(score)
  
  // Limit stored scores to last 100
  if (stats.scores.length > 100) {
    stats.scores = stats.scores.slice(-100)
  }
  
  // Update problem cards based on match history
  const now = new Date().toISOString()
  for (const match of result.matchHistory) {
    if (!match.wasCorrect) {
      // Increment miss count
      if (!stats.problemCards[match.cardId]) {
        stats.problemCards[match.cardId] = {
          character: match.character,
          misses: 0,
          lastMiss: null
        }
      }
      stats.problemCards[match.cardId].misses++
      stats.problemCards[match.cardId].lastMiss = now
    }
  }
  
  // Decay old problem cards
  cleanupProblemCards(stats)
  
  saveStats(stats)
  
  // Also save as recent session
  addRecentSession({
    tags: result.tags,
    mode: result.mode,
    hidePinyin: result.hidePinyin,
    timeLimit: result.timeLimit
  })
  
  return score
}

/**
 * Remove problem cards that haven't been missed recently
 */
function cleanupProblemCards(stats) {
  const cutoff = Date.now() - (PROBLEM_DECAY_DAYS * 24 * 60 * 60 * 1000)
  
  for (const [cardId, data] of Object.entries(stats.problemCards)) {
    if (data.lastMiss && new Date(data.lastMiss).getTime() < cutoff) {
      delete stats.problemCards[cardId]
    }
  }
}

/**
 * Get best score for a specific configuration
 * @param {string} mode - Game mode
 * @param {string[]} tags - Tags used
 * @param {boolean} hidePinyin - Whether pinyin was hidden
 * @returns {Object|null} Best score entry or null
 */
export function getBestScore(mode, tags, hidePinyin = false) {
  const stats = getStats()
  const sortedTags = tags.sort().join(',')
  
  const matching = stats.scores.filter(s => 
    s.mode === mode &&
    s.tags.join(',') === sortedTags &&
    (s.hidePinyin || false) === hidePinyin
  )
  
  if (matching.length === 0) return null
  
  // Best = highest accuracy, then most correct
  return matching.reduce((best, current) => {
    if (current.accuracy > best.accuracy) return current
    if (current.accuracy === best.accuracy && current.correct > best.correct) return current
    return best
  })
}

/**
 * Get problem cards (frequently missed)
 * @param {number} minMisses - Minimum misses to be considered a problem (default 2)
 * @returns {Array} Array of { cardId, character, misses, lastMiss }
 */
export function getProblemCards(minMisses = 2) {
  const stats = getStats()
  
  return Object.entries(stats.problemCards)
    .filter(([_, data]) => data.misses >= minMisses)
    .map(([cardId, data]) => ({
      cardId,
      character: data.character,
      misses: data.misses,
      lastMiss: data.lastMiss
    }))
    .sort((a, b) => b.misses - a.misses)
}

/**
 * Clear a specific problem card (user practiced it successfully)
 * @param {string} cardId - Card ID to clear
 */
export function clearProblemCard(cardId) {
  const stats = getStats()
  delete stats.problemCards[cardId]
  saveStats(stats)
}

/**
 * Get recent scores (last N games)
 * @param {number} limit - Maximum number to return
 * @returns {Array} Score entries, newest first
 */
export function getRecentScores(limit = 10) {
  const stats = getStats()
  return stats.scores.slice(-limit).reverse()
}

/**
 * Get all scores for a specific mode
 * @param {string} mode - Game mode
 * @returns {Array} Score entries for that mode
 */
export function getScoresForMode(mode) {
  const stats = getStats()
  return stats.scores.filter(s => s.mode === mode)
}
