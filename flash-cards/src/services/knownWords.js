/**
 * Simple service to track words the user already knows
 * Stored as a Set in localStorage
 */

const STORAGE_KEY = 'flash-cards-known-words'

let knownSet = null

function ensureLoaded() {
  if (knownSet === null) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      knownSet = stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      knownSet = new Set()
    }
  }
  return knownSet
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...knownSet]))
}

export function isKnown(character) {
  return ensureLoaded().has(character)
}

export function markAsKnown(character) {
  ensureLoaded().add(character)
  save()
}

export function unmarkAsKnown(character) {
  ensureLoaded().delete(character)
  save()
}

export function toggleKnown(character) {
  const set = ensureLoaded()
  if (set.has(character)) {
    set.delete(character)
  } else {
    set.add(character)
  }
  save()
  return set.has(character)
}

export function getKnownWords() {
  return ensureLoaded()
}

export function getKnownCount() {
  return ensureLoaded().size
}
