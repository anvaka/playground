/**
 * Split cedict-tones.txt into frequency-ordered core and extended files
 * 
 * Core: HSK words + high-frequency non-HSK words, tagged with HSK level
 * Extended: Everything else, frequency-ordered
 * 
 * Uses SUBTLEX-CH corpus for real usage frequency data
 * Uses HSK 3.0 word lists for level tagging
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../data')
const HSK_DIR = '/Users/anvaka/projects/other/HSK-3.0/Scripts and data/hsk'
const SUBTLEX_PATH = '/Users/anvaka/projects/other/HSK-3.0/Scripts and data/SUBTLEX_CH_131210_CE.utf8'

// Config
const CORE_THRESHOLD_RANK = 15000 // Include non-HSK words if rank < this

// ============ Loaders ============

function loadSubtlex() {
  console.log('Loading SUBTLEX frequency data...')
  const text = fs.readFileSync(SUBTLEX_PATH, 'utf-8')
  const lines = text.split('\n')
  
  const freq = new Map() // word -> { rank, count }
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split('\t')
    if (parts.length < 5) continue
    
    const word = parts[0]
    const count = parseInt(parts[4], 10) // WCount column
    
    // Keep first occurrence only (highest frequency)
    if (word && !isNaN(count) && !freq.has(word)) {
      freq.set(word, { rank: i, count })
    }
  }
  
  console.log(`  Loaded ${freq.size} frequency entries`)
  return freq
}

function loadHskLists() {
  console.log('Loading HSK word lists...')
  const hsk = new Map() // word -> level
  
  const files = [
    { file: 'HSK 1.txt', level: 1 },
    { file: 'HSK 2.txt', level: 2 },
    { file: 'HSK 3.txt', level: 3 },
    { file: 'HSK 4.txt', level: 4 },
    { file: 'HSK 5.txt', level: 5 },
    { file: 'HSK 6.txt', level: 6 },
    { file: 'HSK 7-9.txt', level: 7 }, // Treat 7-9 as level 7
  ]
  
  for (const { file, level } of files) {
    const text = fs.readFileSync(path.join(HSK_DIR, file), 'utf-8')
    const words = text.split('\n').filter(w => w.trim())
    
    for (const word of words) {
      // Only set if not already set (preserve lowest level)
      if (!hsk.has(word)) {
        hsk.set(word, level)
      }
    }
    
    console.log(`  HSK ${level}: ${words.length} words`)
  }
  
  console.log(`  Total HSK words: ${hsk.size}`)
  return hsk
}

function parseCedictLine(line) {
  if (!line || line.startsWith('#')) return null
  
  const match = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/)
  if (!match) return null
  
  const [, traditional, simplified, pinyin, definitions] = match
  return { traditional, simplified, pinyin, definitions, raw: line }
}

function loadCedict() {
  console.log('Loading CEDICT...')
  const text = fs.readFileSync(path.join(DATA_DIR, 'cedict-tones.txt'), 'utf-8')
  const lines = text.split('\n')
  
  // Group by simplified character - merge entries with same simplified form
  const bySimplified = new Map() // simplified -> [entries]
  let entryCount = 0
  
  for (const line of lines) {
    const entry = parseCedictLine(line)
    if (entry) {
      entryCount++
      if (!bySimplified.has(entry.simplified)) {
        bySimplified.set(entry.simplified, [])
      }
      bySimplified.get(entry.simplified).push(entry)
    }
  }
  
  console.log(`  Loaded ${entryCount} entries for ${bySimplified.size} unique simplified forms`)
  return bySimplified
}

// ============ Merging ============

/**
 * Merge multiple cedict entries for same word into one line
 * 长 with [cháng] and [zhǎng] becomes:
 * 長 长 [cháng] /long/... [zhǎng] /chief/...
 */
function mergeEntries(entries) {
  if (entries.length === 1) {
    return entries[0].raw
  }
  
  // Use first entry's traditional/simplified
  const first = entries[0]
  const parts = [`${first.traditional} ${first.simplified}`]
  
  for (const entry of entries) {
    parts.push(`[${entry.pinyin}] /${entry.definitions}/`)
  }
  
  return parts.join(' ')
}

/**
 * Check if entry is low-priority (surname-only, variant-only)
 */
function isLowPriority(entries) {
  // If ALL entries are low-priority, the word is low-priority
  return entries.every(entry => {
    const defs = entry.definitions.split('/').filter(Boolean)
    const hasSurname = defs.some(d => /surname\b/i.test(d))
    const allVariants = defs.every(d => /^(old |archaic )?variant of /i.test(d))
    return hasSurname || allVariants
  })
}

// ============ Main ============

function main() {
  const subtlex = loadSubtlex()
  const hsk = loadHskLists()
  const cedict = loadCedict()
  
  console.log('\nProcessing entries...')
  
  const coreEntries = []
  const extendedEntries = []
  
  let hskInCore = 0
  let freqInCore = 0
  let hskMissingFromCedict = 0
  let hskMissingFromSubtlex = 0
  
  // Track HSK words found
  const hskFound = new Set()
  
  for (const [simplified, entries] of cedict) {
    const hskLevel = hsk.get(simplified) || 0
    const freqData = subtlex.get(simplified)
    const rank = freqData ? freqData.rank : Infinity
    
    if (hskLevel > 0) {
      hskFound.add(simplified)
    }
    
    // Determine if core or extended
    const isCore = hskLevel > 0 || rank < CORE_THRESHOLD_RANK
    const isLowPri = isLowPriority(entries)
    
    const merged = mergeEntries(entries)
    const item = {
      simplified,
      hskLevel,
      rank,
      isLowPri,
      line: merged
    }
    
    if (isCore) {
      coreEntries.push(item)
      if (hskLevel > 0) hskInCore++
      else freqInCore++
    } else {
      extendedEntries.push(item)
    }
  }
  
  // Check for HSK words missing from CEDICT
  for (const [word, level] of hsk) {
    if (!hskFound.has(word)) {
      hskMissingFromCedict++
    }
    if (!subtlex.has(word)) {
      hskMissingFromSubtlex++
    }
  }
  
  console.log(`\n--- Statistics ---`)
  console.log(`Core entries: ${coreEntries.length}`)
  console.log(`  - HSK words: ${hskInCore}`)
  console.log(`  - High-freq non-HSK: ${freqInCore}`)
  console.log(`Extended entries: ${extendedEntries.length}`)
  console.log(`HSK words missing from CEDICT: ${hskMissingFromCedict}`)
  console.log(`HSK words missing from SUBTLEX: ${hskMissingFromSubtlex}`)
  
  // Sort by frequency (rank), with low-priority at end
  const sortByFreq = (a, b) => {
    if (a.isLowPri !== b.isLowPri) return a.isLowPri ? 1 : -1
    return a.rank - b.rank
  }
  
  coreEntries.sort(sortByFreq)
  extendedEntries.sort(sortByFreq)
  
  // Format output
  // Core format: LEVEL|traditional simplified [pinyin] /defs/
  // where LEVEL is 0-9 (0 = non-HSK but frequent)
  
  const coreLines = ['# Core dictionary - HSK words + high-frequency']
  for (const item of coreEntries) {
    coreLines.push(`${item.hskLevel}|${item.line}`)
  }
  
  const extendedLines = ['# Extended dictionary - less common words']
  for (const item of extendedEntries) {
    extendedLines.push(item.line)
  }
  
  // Write files
  const coreText = coreLines.join('\n')
  const extendedText = extendedLines.join('\n')
  
  fs.writeFileSync(path.join(DATA_DIR, 'cedict-core.txt'), coreText)
  fs.writeFileSync(path.join(DATA_DIR, 'cedict-extended.txt'), extendedText)
  
  const coreSize = Buffer.byteLength(coreText, 'utf-8')
  const extendedSize = Buffer.byteLength(extendedText, 'utf-8')
  
  console.log(`\n--- Output Files ---`)
  console.log(`cedict-core.txt: ${coreEntries.length} entries, ${(coreSize / 1024 / 1024).toFixed(2)} MB`)
  console.log(`cedict-extended.txt: ${extendedEntries.length} entries, ${(extendedSize / 1024 / 1024).toFixed(2)} MB`)
  console.log(`Total: ${(coreSize + extendedSize) / 1024 / 1024} MB (was ~9 MB)`)
  
  // Sample output
  console.log(`\n--- Sample Core (top 20) ---`)
  for (let i = 0; i < Math.min(20, coreEntries.length); i++) {
    const e = coreEntries[i]
    console.log(`  ${e.simplified} (HSK${e.hskLevel}, rank ${e.rank})`)
  }
  
  // Find some HSK words not in SUBTLEX
  console.log(`\n--- HSK words missing from SUBTLEX (sample) ---`)
  let missing = 0
  for (const [word, level] of hsk) {
    if (!subtlex.has(word) && missing < 10) {
      console.log(`  HSK${level}: ${word}`)
      missing++
    }
  }
}

main()
