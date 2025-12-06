/**
 * Dictionary service for parsing and searching CEDICT and IDS data
 */

let cedictEntries = null
let idsEntries = null
let charFrequency = null  // Maps character to usage count across dictionary

/**
 * Parse a CEDICT line into structured entry
 * Format: 傳統 传统 [chuan2 tong3] /tradition/traditional/
 */
function parseCedictLine(line) {
  if (!line || line.startsWith('#')) return null
  
  const match = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/)
  if (!match) return null
  
  const [, traditional, simplified, pinyin, definitions] = match
  return {
    traditional,
    simplified,
    pinyin,
    definitions: definitions.split('/').filter(Boolean),
    raw: line
  }
}

/**
 * Parse IDS line into structured entry
 * Format: 杯	⿰木不
 */
function parseIdsLine(line) {
  if (!line || line.startsWith('#')) return null
  
  const parts = line.split('\t')
  if (parts.length < 2) return null
  
  return {
    character: parts[0],
    decomposition: parts[1]
  }
}

/**
 * Load and parse CEDICT file
 */
async function loadCedict() {
  if (cedictEntries) return cedictEntries
  
  const response = await fetch('./cedict-tones.txt')
  const text = await response.text()
  
  cedictEntries = new Map()
  charFrequency = new Map()
  
  for (const line of text.split('\n')) {
    const entry = parseCedictLine(line)
    if (entry) {
      // Index by both simplified and traditional
      if (!cedictEntries.has(entry.simplified)) {
        cedictEntries.set(entry.simplified, [])
      }
      cedictEntries.get(entry.simplified).push(entry)
      
      if (entry.traditional !== entry.simplified) {
        if (!cedictEntries.has(entry.traditional)) {
          cedictEntries.set(entry.traditional, [])
        }
        cedictEntries.get(entry.traditional).push(entry)
      }
      
      // Count character frequency - how often each char appears in dictionary words
      for (const char of entry.simplified) {
        charFrequency.set(char, (charFrequency.get(char) || 0) + 1)
      }
    }
  }
  
  return cedictEntries
}

/**
 * Get frequency score for a word (sum of character frequencies)
 * Higher = more common characters
 */
function getWordFrequency(word) {
  if (!charFrequency) return 0
  let freq = 0
  for (const char of word) {
    freq += charFrequency.get(char) || 0
  }
  // Normalize by word length to avoid bias toward longer words
  return freq / word.length
}

/**
 * Load and parse IDS file
 */
async function loadIds() {
  if (idsEntries) return idsEntries
  
  const response = await fetch('./ids-compact.txt')
  const text = await response.text()
  
  idsEntries = new Map()
  
  for (const line of text.split('\n')) {
    const entry = parseIdsLine(line)
    if (entry) {
      idsEntries.set(entry.character, entry)
    }
  }
  
  return idsEntries
}

/**
 * Check if a CEDICT entry is low-priority for learners
 * Deprioritizes: surname entries, variant references
 */
function isLowPriorityEntry(entry) {
  const defs = entry.definitions
  
  // Surname entry: any definition mentions surname
  const hasSurname = defs.some(d => /surname\b/i.test(d))
  if (hasSurname) return true
  
  // Variant-only: all definitions are just "variant of X"
  const allVariants = defs.every(d => /^(old |archaic )?variant of /i.test(d))
  if (allVariants) return true
  
  return false
}

/**
 * Sort CEDICT entries to prefer useful definitions
 * Low-priority entries (surnames, variants) pushed to end
 */
function sortCedictEntries(entries) {
  if (!entries || entries.length <= 1) return entries
  return entries.sort((a, b) => {
    const aIsLow = isLowPriorityEntry(a)
    const bIsLow = isLowPriorityEntry(b)
    if (aIsLow && !bIsLow) return 1
    if (!aIsLow && bIsLow) return -1
    return 0
  })
}

/**
 * Initialize dictionary - load both files
 */
export async function initDictionary() {
  await Promise.all([loadCedict(), loadIds()])
}

/**
 * Check if a word exists in the dictionary
 */
export async function isInDictionary(word) {
  await loadCedict()
  return cedictEntries.has(word)
}

/**
 * Look up a Chinese word/character
 */
export async function lookupChinese(word) {
  await loadCedict()
  await loadIds()
  
  const rawResults = cedictEntries.get(word) || []
  const cedictResults = sortCedictEntries(rawResults)
  const idsResult = idsEntries.get(word)
  
  // For multi-character words, also get component breakdowns
  const componentIds = []
  if (word.length > 1) {
    for (const char of word) {
      const ids = idsEntries.get(char)
      if (ids) componentIds.push(ids)
    }
  }
  
  return {
    cedict: cedictResults,
    ids: idsResult,
    componentIds: componentIds.length ? componentIds : null
  }
}

/**
 * Normalize pinyin for comparison - remove tones and lowercase
 */
export function normalizePinyin(pinyin) {
  return pinyin
    .toLowerCase()
    .replace(/[āáǎà]/g, 'a')
    .replace(/[ēéěè]/g, 'e')
    .replace(/[īíǐì]/g, 'i')
    .replace(/[ōóǒò]/g, 'o')
    .replace(/[ūúǔù]/g, 'u')
    .replace(/[ǖǘǚǜü]/g, 'v')
    .replace(/[1-5]/g, '')
    .replace(/\s+/g, '')
}

/**
 * Calculate match quality score for ranking
 * Lower score = better match
 */
function getMatchScore(entryText, query, isExact) {
  if (isExact) return 0
  if (entryText.startsWith(query)) return 1
  return 2
}

/**
 * Search dictionary by pinyin
 * Returns results sorted: exact match → prefix match → partial match
 * Within same match type: sorted by character frequency (popularity)
 */
export async function searchPinyin(query, limit = 20) {
  await loadCedict()
  
  const results = []
  const seen = new Set()
  const queryNorm = normalizePinyin(query)
  
  for (const entries of cedictEntries.values()) {
    for (const entry of entries) {
      const entryPinyinNorm = normalizePinyin(entry.pinyin)
      if (entryPinyinNorm.includes(queryNorm)) {
        const key = entry.simplified + entry.pinyin
        if (!seen.has(key)) {
          seen.add(key)
          const isExact = entryPinyinNorm === queryNorm
          const score = getMatchScore(entryPinyinNorm, queryNorm, isExact)
          const freq = getWordFrequency(entry.simplified)
          results.push({ entry, score, freq })
        }
      }
    }
  }
  
  // Sort by: low-priority (last) → match score → word length → frequency
  results.sort((a, b) => {
    const aIsLow = isLowPriorityEntry(a.entry)
    const bIsLow = isLowPriorityEntry(b.entry)
    if (aIsLow !== bIsLow) return aIsLow ? 1 : -1
    if (a.score !== b.score) return a.score - b.score
    if (a.entry.simplified.length !== b.entry.simplified.length) {
      return a.entry.simplified.length - b.entry.simplified.length
    }
    return b.freq - a.freq  // Higher frequency first
  })
  
  return results.slice(0, limit).map(r => r.entry)
}

/**
 * Search dictionary by English meaning
 * Returns results sorted: exact word match → prefix match → partial match
 * Within same match type: sorted by character frequency (popularity)
 */
export async function searchEnglish(query, limit = 20) {
  await loadCedict()
  
  const results = []
  const seen = new Set()
  const queryLower = query.toLowerCase()
  
  for (const entries of cedictEntries.values()) {
    for (const entry of entries) {
      const defText = entry.definitions.join(' ').toLowerCase()
      if (defText.includes(queryLower)) {
        const key = entry.simplified + entry.pinyin
        if (!seen.has(key)) {
          seen.add(key)
          // Check if any definition is an exact match or starts with query
          const isExact = entry.definitions.some(d => d.toLowerCase() === queryLower)
          const isPrefix = entry.definitions.some(d => d.toLowerCase().startsWith(queryLower))
          const score = isExact ? 0 : (isPrefix ? 1 : 2)
          const freq = getWordFrequency(entry.simplified)
          results.push({ entry, score, freq })
        }
      }
    }
  }
  
  // Sort by: low-priority (last) → match score → word length → frequency
  results.sort((a, b) => {
    const aIsLow = isLowPriorityEntry(a.entry)
    const bIsLow = isLowPriorityEntry(b.entry)
    if (aIsLow !== bIsLow) return aIsLow ? 1 : -1
    if (a.score !== b.score) return a.score - b.score
    if (a.entry.simplified.length !== b.entry.simplified.length) {
      return a.entry.simplified.length - b.entry.simplified.length
    }
    return b.freq - a.freq  // Higher frequency first
  })
  
  return results.slice(0, limit).map(r => r.entry)
}

/**
 * Check if query looks like pinyin (latin letters, optionally with tone marks/numbers)
 */
function looksLikePinyin(query) {
  // Must be all latin letters (with possible tone marks) and numbers
  return /^[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü\s1-5]+$/.test(query)
}

/**
 * Search dictionary - auto-detect Chinese vs Pinyin vs English
 * Priority: Chinese exact match → Pinyin matches → English matches
 */
export async function search(query, limit = 20) {
  if (!query || !query.trim()) return []
  
  query = query.trim()
  
  // Check if query contains Chinese characters
  const hasChinese = /[\u4e00-\u9fff]/.test(query)
  
  if (hasChinese) {
    const result = await lookupChinese(query)
    return result.cedict
  }
  
  // For non-Chinese queries, search both pinyin and English
  // Pinyin matches appear first, then English matches
  const seen = new Set()
  const results = []
  
  // First, search pinyin if query looks like it could be pinyin
  if (looksLikePinyin(query)) {
    const pinyinResults = await searchPinyin(query, limit)
    for (const entry of pinyinResults) {
      const key = entry.simplified + entry.pinyin
      if (!seen.has(key)) {
        seen.add(key)
        results.push(entry)
      }
    }
  }
  
  // Then search English definitions if we need more results
  if (results.length < limit) {
    const englishResults = await searchEnglish(query, limit - results.length)
    for (const entry of englishResults) {
      const key = entry.simplified + entry.pinyin
      if (!seen.has(key)) {
        seen.add(key)
        results.push(entry)
      }
    }
  }
  
  return results.slice(0, limit)
}

/**
 * Get IDS decomposition for a character
 */
export async function getDecomposition(char) {
  await loadIds()
  return idsEntries.get(char) || null
}

/**
 * Format classifier notation into human-readable form
 * CL:個|个[gè] → (measure word: 个 gè)
 * CL:個|个[gè],位[wèi] → (measure word: 个 gè, 位 wèi)
 */
function formatClassifier(text) {
  // Match CL: followed by classifier entries
  return text.replace(/CL:([^\s/]+)/g, (match, classifiers) => {
    const parts = classifiers.split(',').map(cl => {
      // Each classifier can be: 個|个[gè] or just 个[gè]
      const m = cl.match(/(?:([^\|]+)\|)?([^\[]+)\[([^\]]+)\]/)
      if (m) {
        const simplified = m[2]
        const pinyin = m[3]
        return `${simplified} ${pinyin}`
      }
      return cl
    })
    return `(measure word: ${parts.join(', ')})`
  })
}

/**
 * Expand common CEDICT abbreviations to be more learner-friendly
 */
const abbreviations = {
  '(Tw)': '(Taiwan)',
  '(PRC)': '(Mainland China)',
  '(coll.)': '(colloquial)',
  '(fig.)': '(figurative)',
  '(lit.)': '(literal)',
  '(onom.)': '(onomatopoeia)',
  '(TCM)': '(Traditional Chinese Medicine)',
  '(med.)': '(medical)',
  '(math.)': '(mathematics)',
  '(abbr.)': '(abbreviation)',
}

/**
 * Format a single definition for display - expand abbreviations
 */
function formatDefinition(def) {
  let result = formatClassifier(def)
  for (const [abbr, expanded] of Object.entries(abbreviations)) {
    result = result.replace(abbr, expanded)
  }
  return result
}

/**
 * Format definitions array for user-friendly display
 */
export function formatDefinitions(definitions, limit = null) {
  const defs = limit ? definitions.slice(0, limit) : definitions
  return defs.map(formatDefinition).join('; ')
}

/**
 * Format dictionary entry for LLM context
 */
export function formatForLLM(lookup) {
  const parts = []
  
  if (lookup.cedict && lookup.cedict.length > 0) {
    const entry = lookup.cedict[0]
    parts.push(`${entry.simplified} [${entry.pinyin}] /${entry.definitions.join('/')}/`)
    
    if (lookup.cedict.length > 1) {
      for (let i = 1; i < lookup.cedict.length; i++) {
        const alt = lookup.cedict[i]
        parts.push(`  Also: [${alt.pinyin}] /${alt.definitions.join('/')}/`)
      }
    }
  }
  
  if (lookup.ids) {
    parts.push(`\nComponent breakdown: ${lookup.ids.decomposition}`)
  }
  
  if (lookup.componentIds) {
    parts.push('\nCharacter components:')
    for (const comp of lookup.componentIds) {
      parts.push(`  ${comp.character}: ${comp.decomposition}`)
    }
  }
  
  return parts.join('\n')
}
