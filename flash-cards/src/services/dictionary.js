/**
 * Dictionary service for parsing and searching CEDICT and IDS data
 * 
 * Uses split dictionary files:
 * - cedict-core.txt: HSK words + high-frequency, with HSK level tags
 * - cedict-extended.txt: Less common words, loaded in background
 * 
 * Both files are frequency-ordered (most common first)
 */

let coreEntries = null      // Map<simplified, entry[]> - core dictionary
let extendedEntries = null  // Map<simplified, entry[]> - extended dictionary
let idsEntries = null       // Map<char, decomposition>
let hskLevels = null        // Map<simplified, level> - HSK level lookup
let hskWordsByLevel = null  // Map<level, simplified[]> - words by HSK level, frequency-ordered
let coreReady = null        // Promise for core load
let extendedReady = null    // Promise for extended load

/**
 * Ensure dictionary is initialized before use
 * Auto-initializes if initDictionary() wasn't called
 */
async function ensureInitialized() {
  if (!coreReady) {
    await initDictionary()
  }
  await coreReady
}

/**
 * Parse a merged CEDICT line into structured entries
 * New format with merged readings:
 *   傳統 传统 [chuán tǒng] /tradition/ [zhuàn] /biography/
 * Returns array of entries (one per reading)
 */
function parseMergedCedictLine(line, hskLevel = 0) {
  if (!line || line.startsWith('#')) return null
  
  // Extract traditional and simplified first
  const headMatch = line.match(/^(\S+)\s+(\S+)\s+/)
  if (!headMatch) return null
  
  const traditional = headMatch[1]
  const simplified = headMatch[2]
  const rest = line.slice(headMatch[0].length)
  
  // Parse all [pinyin] /defs/ pairs
  const entries = []
  const pairRegex = /\[([^\]]+)\]\s+\/([^/]*(?:\/[^/]*)*)\//g
  let match
  
  while ((match = pairRegex.exec(rest)) !== null) {
    const pinyin = match[1]
    const definitions = match[2].split('/').filter(Boolean)
    
    entries.push({
      traditional,
      simplified,
      pinyin,
      definitions,
      hskLevel
    })
  }
  
  return entries.length > 0 ? entries : null
}

/**
 * Parse a core dictionary line (has HSK prefix)
 * Format: LEVEL|傳統 传统 [pinyin] /defs/
 */
function parseCoreLine(line) {
  if (!line || line.startsWith('#')) return null
  
  const pipeIdx = line.indexOf('|')
  if (pipeIdx === -1) return null
  
  const hskLevel = parseInt(line.slice(0, pipeIdx), 10)
  const cedictPart = line.slice(pipeIdx + 1)
  
  return parseMergedCedictLine(cedictPart, hskLevel)
}

/**
 * Parse an extended dictionary line (no HSK prefix)
 */
function parseExtendedLine(line) {
  return parseMergedCedictLine(line, 0)
}

/**
 * Add entries to a dictionary map, indexing by simplified and traditional
 */
function addToMap(map, entries, hskMap) {
  for (const entry of entries) {
    // Index by simplified
    if (!map.has(entry.simplified)) {
      map.set(entry.simplified, [])
    }
    map.get(entry.simplified).push(entry)
    
    // Index by traditional if different
    if (entry.traditional !== entry.simplified) {
      if (!map.has(entry.traditional)) {
        map.set(entry.traditional, [])
      }
      map.get(entry.traditional).push(entry)
    }
    
    // Track HSK level
    if (hskMap && entry.hskLevel > 0) {
      // Keep lowest level if word appears in multiple levels
      const existing = hskMap.get(entry.simplified)
      if (!existing || entry.hskLevel < existing) {
        hskMap.set(entry.simplified, entry.hskLevel)
      }
    }
  }
}

/**
 * Load core dictionary (HSK + high-frequency words)
 * This is loaded first and blocks initialization
 */
async function loadCore() {
  if (coreEntries) return coreEntries
  
  const response = await fetch('./cedict-core.txt')
  const text = await response.text()
  
  coreEntries = new Map()
  hskLevels = new Map()
  hskWordsByLevel = new Map()
  
  // Initialize level arrays (1-7, plus 0 for high-freq non-HSK)
  for (let i = 0; i <= 7; i++) {
    hskWordsByLevel.set(i, [])
  }
  
  const seenWords = new Set()
  
  for (const line of text.split('\n')) {
    const entries = parseCoreLine(line)
    if (entries) {
      addToMap(coreEntries, entries, hskLevels)
      
      // Track unique words by HSK level in file order (frequency order)
      const firstEntry = entries[0]
      if (!seenWords.has(firstEntry.simplified)) {
        seenWords.add(firstEntry.simplified)
        const level = firstEntry.hskLevel
        hskWordsByLevel.get(level).push(firstEntry.simplified)
      }
    }
  }
  
  return coreEntries
}

/**
 * Load extended dictionary (less common words)
 * Loaded in background after core is ready
 */
async function loadExtended() {
  if (extendedEntries) return extendedEntries
  
  const response = await fetch('./cedict-extended.txt')
  const text = await response.text()
  
  extendedEntries = new Map()
  
  for (const line of text.split('\n')) {
    const entries = parseExtendedLine(line)
    if (entries) {
      addToMap(extendedEntries, entries, null)
    }
  }
  
  return extendedEntries
}

/**
 * Parse IDS line into structured entry
 * Format: 杯⿰木不
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
  return [...entries].sort((a, b) => {
    const aIsLow = isLowPriorityEntry(a)
    const bIsLow = isLowPriorityEntry(b)
    if (aIsLow && !bIsLow) return 1
    if (!aIsLow && bIsLow) return -1
    return 0
  })
}

/**
 * Get combined entries from core and extended dictionaries
 */
function getCombinedEntries(word) {
  const results = []
  
  // Core entries first (higher frequency)
  if (coreEntries?.has(word)) {
    results.push(...coreEntries.get(word))
  }
  
  // Extended entries if loaded
  if (extendedEntries?.has(word)) {
    results.push(...extendedEntries.get(word))
  }
  
  return results
}

/**
 * Initialize dictionary - load core immediately, extended in background
 */
export async function initDictionary() {
  // Start loading all files
  coreReady = loadCore()
  extendedReady = loadExtended()
  const idsReady = loadIds()
  
  // Wait for core and IDS (essential for basic functionality)
  await Promise.all([coreReady, idsReady])
  
  // Extended loads in background - don't block
  extendedReady.catch(err => console.warn('Failed to load extended dictionary:', err))
}

/**
 * Check if a word exists in the dictionary
 */
export async function isInDictionary(word) {
  await ensureInitialized()
  if (coreEntries.has(word)) return true
  
  // Check extended if loaded
  if (extendedEntries?.has(word)) return true
  
  return false
}

/**
 * Get HSK level for a word (1-7, or 0 if not HSK)
 */
export function getHskLevel(word) {
  return hskLevels?.get(word) || 0
}

/**
 * Get words by HSK level, paginated
 * @param {number} level - HSK level (1-7), or 0 for all HSK words
 * @param {number} offset - Starting index
 * @param {number} limit - Number of words to return
 * @returns {Array} Array of { simplified, entry } objects
 */
export async function getWordsByHskLevel(level, offset = 0, limit = 50) {
  await ensureInitialized()
  
  let words
  if (level === 0) {
    // All HSK words (levels 1-7), merged in frequency order
    // Since file is frequency-ordered, we combine all levels
    words = []
    for (let l = 1; l <= 7; l++) {
      words.push(...(hskWordsByLevel.get(l) || []))
    }
    // Re-sort by frequency (get order from coreEntries iteration)
    // Actually, we need frequency order across all levels
    // Simpler: collect all HSK words maintaining their original order
    const allHsk = []
    const seen = new Set()
    for (const [simplified, entries] of coreEntries) {
      if (!seen.has(simplified) && entries[0]?.hskLevel > 0) {
        seen.add(simplified)
        allHsk.push(simplified)
      }
    }
    words = allHsk
  } else {
    words = hskWordsByLevel.get(level) || []
  }
  
  const slice = words.slice(offset, offset + limit)
  
  return slice.map(simplified => {
    const entries = coreEntries.get(simplified) || []
    return {
      simplified,
      entry: entries[0] || null
    }
  })
}

/**
 * Get total count of words for an HSK level
 * @param {number} level - HSK level (1-7), or 0 for all HSK words
 */
export function getHskWordCount(level) {
  if (!hskWordsByLevel) return 0
  
  if (level === 0) {
    let total = 0
    for (let l = 1; l <= 7; l++) {
      total += (hskWordsByLevel.get(l) || []).length
    }
    return total
  }
  
  return (hskWordsByLevel.get(level) || []).length
}

/**
 * Look up a Chinese word/character
 */
export async function lookupChinese(word) {
  await ensureInitialized()
  
  const rawResults = getCombinedEntries(word)
  const cedictResults = sortCedictEntries(rawResults)
  const idsResult = idsEntries?.get(word)
  
  // For multi-character words, also get component breakdowns
  const componentIds = []
  if (word.length > 1 && idsEntries) {
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
 * Iterate over all dictionary entries (core first, then extended)
 */
function* allEntries() {
  if (coreEntries) {
    for (const entries of coreEntries.values()) {
      for (const entry of entries) {
        yield entry
      }
    }
  }
  if (extendedEntries) {
    for (const entries of extendedEntries.values()) {
      for (const entry of entries) {
        yield entry
      }
    }
  }
}

/**
 * Search dictionary by pinyin
 * Returns results sorted: exact match → prefix match → partial match
 * Within same match type: core entries first (frequency-ordered)
 */
export async function searchPinyin(query, limit = 20) {
  await ensureInitialized()
  
  const results = []
  const seen = new Set()
  const queryNorm = normalizePinyin(query)
  
  for (const entry of allEntries()) {
    const entryPinyinNorm = normalizePinyin(entry.pinyin)
    if (entryPinyinNorm.includes(queryNorm)) {
      const key = entry.simplified + entry.pinyin
      if (!seen.has(key)) {
        seen.add(key)
        const isExact = entryPinyinNorm === queryNorm
        const score = getMatchScore(entryPinyinNorm, queryNorm, isExact)
        const isCore = coreEntries?.has(entry.simplified)
        results.push({ entry, score, isCore })
      }
    }
  }
  
  // Sort by: low-priority (last) → match score → word length → core first
  results.sort((a, b) => {
    const aIsLow = isLowPriorityEntry(a.entry)
    const bIsLow = isLowPriorityEntry(b.entry)
    if (aIsLow !== bIsLow) return aIsLow ? 1 : -1
    if (a.score !== b.score) return a.score - b.score
    if (a.entry.simplified.length !== b.entry.simplified.length) {
      return a.entry.simplified.length - b.entry.simplified.length
    }
    // Core entries (high frequency) come first
    if (a.isCore !== b.isCore) return a.isCore ? -1 : 1
    return 0
  })
  
  return results.slice(0, limit).map(r => r.entry)
}

/**
 * Search dictionary by English meaning
 * Returns results sorted: exact word match → prefix match → partial match
 * Within same match type: core entries first (frequency-ordered)
 */
export async function searchEnglish(query, limit = 20) {
  await ensureInitialized()
  
  const results = []
  const seen = new Set()
  const queryLower = query.toLowerCase()
  
  for (const entry of allEntries()) {
    const defText = entry.definitions.join(' ').toLowerCase()
    if (defText.includes(queryLower)) {
      const key = entry.simplified + entry.pinyin
      if (!seen.has(key)) {
        seen.add(key)
        const isExact = entry.definitions.some(d => d.toLowerCase() === queryLower)
        const isPrefix = entry.definitions.some(d => d.toLowerCase().startsWith(queryLower))
        const score = isExact ? 0 : (isPrefix ? 1 : 2)
        const isCore = coreEntries?.has(entry.simplified)
        results.push({ entry, score, isCore })
      }
    }
  }
  
  // Sort by: low-priority (last) → match score → word length → core first
  results.sort((a, b) => {
    const aIsLow = isLowPriorityEntry(a.entry)
    const bIsLow = isLowPriorityEntry(b.entry)
    if (aIsLow !== bIsLow) return aIsLow ? 1 : -1
    if (a.score !== b.score) return a.score - b.score
    if (a.entry.simplified.length !== b.entry.simplified.length) {
      return a.entry.simplified.length - b.entry.simplified.length
    }
    if (a.isCore !== b.isCore) return a.isCore ? -1 : 1
    return 0
  })
  
  return results.slice(0, limit).map(r => r.entry)
}

/**
 * Check if query looks like pinyin (latin letters, optionally with tone marks/numbers)
 */
function looksLikePinyin(query) {
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
  await ensureInitialized()
  return idsEntries?.get(char) || null
}

/**
 * Format classifier notation into human-readable form
 * CL:個|个[gè] → (measure word: 个 gè)
 */
function formatClassifier(text) {
  return text.replace(/CL:([^\s/]+)/g, (match, classifiers) => {
    const parts = classifiers.split(',').map(cl => {
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
