#!/usr/bin/env node
/**
 * Generate pre-filled HSK flashcard decks using OpenAI
 * 
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generate-hsk-decks.js [level]
 * 
 * Examples:
 *   node scripts/generate-hsk-decks.js        # Generate all levels
 *   node scripts/generate-hsk-decks.js 1      # Generate HSK 1 only
 *   node scripts/generate-hsk-decks.js 1,2,3  # Generate HSK 1, 2, 3
 * 
 * Output: data/hsk/hsk1.json, data/hsk/hsk2.json, etc.
 * Progress is saved to data/hsk/.progress.json for resume capability.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../data')
const OUTPUT_DIR = join(DATA_DIR, 'hsk')
const PROGRESS_FILE = join(OUTPUT_DIR, '.progress.json')

// Rate limiting: delay between API calls (ms)
const API_DELAY_MS = 500
const MAX_RETRIES = 3

// ============ Dictionary Parsing (adapted from src/services/dictionary.js) ============

let cedictEntries = null
let idsEntries = null

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

function parseIdsLine(line) {
  if (!line || line.startsWith('#')) return null
  
  const parts = line.split('\t')
  if (parts.length < 2) return null
  
  return {
    character: parts[0],
    decomposition: parts[1]
  }
}

function loadCedict() {
  if (cedictEntries) return cedictEntries
  
  const filePath = join(DATA_DIR, 'cedict-tones.txt')
  const text = readFileSync(filePath, 'utf-8')
  
  cedictEntries = new Map()
  
  for (const line of text.split('\n')) {
    const entry = parseCedictLine(line)
    if (entry) {
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
    }
  }
  
  return cedictEntries
}

function loadIds() {
  if (idsEntries) return idsEntries
  
  const filePath = join(DATA_DIR, 'ids-compact.txt')
  const text = readFileSync(filePath, 'utf-8')
  
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
 * Deprioritizes: surname-only entries, variant references
 */
function isLowPriorityEntry(entry) {
  const defs = entry.definitions
  
  // Surname-only: capitalized pinyin + all definitions are surnames
  const hasCapitalPinyin = /^[A-Z]/.test(entry.pinyin)
  const allSurnames = defs.every(d => /surname\b/i.test(d))
  if (hasCapitalPinyin && allSurnames) return true
  
  // Variant-only: all definitions are just "variant of X"
  const allVariants = defs.every(d => /^(old |archaic )?variant of /i.test(d))
  if (allVariants) return true
  
  return false
}

/**
 * Sort CEDICT entries to prefer useful definitions
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

function lookupChinese(word) {
  loadCedict()
  loadIds()
  
  const rawResults = cedictEntries.get(word) || []
  const cedictResults = sortCedictEntries(rawResults)
  const idsResult = idsEntries.get(word)
  
  // For multi-character words, get component breakdowns
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

// ============ LLM Functions (adapted from src/services/llm.js) ============

function formatForLLM(lookup) {
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

function buildPrompt(word, dictContext) {
  return `You are a Chinese language learning assistant creating a flashcard for: "${word}"

DICTIONARY DEFINITION:
${dictContext || "Not found in dictionary"}

Generate a flashcard with the following sections:

**FRONT (keep concise):**
- Character: ${word}
- Pinyin: [provide accurate pinyin with tone marks]
- Micro-clue: [3-6 words max that hint at meaning without giving it away completely]

**BACK:**
- Translation: [concise dictionary-style translation, max 10 words, e.g. for 不 "no; not; un-" or "to eat; to consume"]
- Meaning: [full English definition, clear and comprehensive]
- Components: [explain the radicals/components and their meanings - use the dictionary data provided above if available]
- Examples: [2-3 example sentences in Chinese with pinyin and English translations]
- Related words: [3-5 related Chinese words with pinyin and English]
- Memory story: [create a short, funny or shocking micro-story to help remember components, meaning and tone]

**IMAGE PROMPT:**
[Describe a simple, clear image that visually represents the word's meaning. No text in image. Focus on concrete, memorable visual elements. Keep under 50 words. Sci-fi futuristic style with networks is a plus]

Respond with valid JSON matching this schema:
{
  "pinyin": "...",
  "microClue": "...",
  "translation": "concise dictionary-style, max 10 words",
  "meaning": "...",
  "components": "...",
  "examples": [{"zh": "...", "pinyin": "...", "en": "..."}],
  "relatedWords": [{"zh": "...", "pinyin": "...", "en": "..."}],
  "memoryStory": "...",
  "imagePrompt": "..."
}`
}

function parseResponse(content) {
  try {
    return JSON.parse(content)
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid response format: no JSON found')
    }
    return JSON.parse(jsonMatch[0])
  }
}

function validateCardData(data) {
  const required = ['pinyin', 'microClue', 'meaning', 'components', 'examples', 'memoryStory']
  const missing = required.filter(field => !data[field])
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`)
  }
  
  if (!Array.isArray(data.examples) || data.examples.length === 0) {
    throw new Error('Examples must be a non-empty array')
  }
  
  return true
}

// ============ OpenAI API ============

async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable not set')
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-5.1',
      messages: [
        { role: 'system', content: 'You are a helpful Chinese language learning assistant. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }
  
  const data = await response.json()
  return data.choices[0].message.content
}

// ============ Progress Tracking ============

function loadProgress() {
  if (existsSync(PROGRESS_FILE)) {
    return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'))
  }
  return { completed: {}, failed: {} }
}

function saveProgress(progress) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

// ============ Card Generation ============

async function generateCard(hskWord, retryCount = 0) {
  const { hanzi, pinyin: hskPinyin, translations } = hskWord
  
  // Look up in dictionary
  const lookup = lookupChinese(hanzi)
  
  // If no CEDICT entry, create one from HSK data
  if (lookup.cedict.length === 0) {
    lookup.cedict = [{
      simplified: hanzi,
      traditional: hanzi,
      pinyin: hskPinyin,
      definitions: translations,
      raw: `${hanzi} ${hanzi} [${hskPinyin}] /${translations.join('/')}/`
    }]
  }
  
  const dictContext = formatForLLM(lookup)
  const prompt = buildPrompt(hanzi, dictContext)
  
  try {
    const response = await callOpenAI(prompt)
    const generated = parseResponse(response)
    validateCardData(generated)
    
    return {
      id: `hsk${hskWord.level}-${String(hskWord.id).padStart(4, '0')}`,
      hskLevel: hskWord.level,
      hskId: hskWord.id,
      type: 'vocabulary',
      character: hanzi,
      ...generated,
      rawDictEntry: lookup.cedict[0]?.raw || '',
      rawIdsEntry: lookup.ids?.decomposition || ''
    }
  } catch (err) {
    if (retryCount < MAX_RETRIES) {
      console.log(`    Retry ${retryCount + 1}/${MAX_RETRIES} for ${hanzi}: ${err.message}`)
      await sleep(API_DELAY_MS * 2)
      return generateCard(hskWord, retryCount + 1)
    }
    throw err
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============ Main ============

async function processLevel(level, hskWords, progress) {
  const levelWords = hskWords.filter(w => w.level === level)
  const outputFile = join(OUTPUT_DIR, `hsk${level}.json`)
  
  console.log(`\n📚 Processing HSK ${level} (${levelWords.length} words)`)
  
  // Load existing results if resuming
  let results = []
  if (existsSync(outputFile)) {
    results = JSON.parse(readFileSync(outputFile, 'utf-8'))
    console.log(`   Found ${results.length} existing cards`)
  }
  
  const existingIds = new Set(results.map(r => r.hskId))
  const toProcess = levelWords.filter(w => !existingIds.has(w.id))
  
  if (toProcess.length === 0) {
    console.log(`   ✅ All cards already generated`)
    return results
  }
  
  console.log(`   Generating ${toProcess.length} remaining cards...`)
  
  let processed = 0
  let failed = 0
  
  for (const word of toProcess) {
    const progressKey = `${level}-${word.id}`
    
    // Skip if previously failed (can retry by deleting .progress.json)
    if (progress.failed[progressKey]) {
      console.log(`   ⏭️  Skipping ${word.hanzi} (previously failed)`)
      failed++
      continue
    }
    
    try {
      process.stdout.write(`   [${processed + 1}/${toProcess.length}] ${word.hanzi}...`)
      
      const card = await generateCard(word)
      results.push(card)
      
      progress.completed[progressKey] = true
      
      // Save progress after each card
      writeFileSync(outputFile, JSON.stringify(results, null, 2))
      saveProgress(progress)
      
      console.log(' ✓')
      processed++
      
      // Rate limiting
      await sleep(API_DELAY_MS)
      
    } catch (err) {
      console.log(` ✗ ${err.message}`)
      progress.failed[progressKey] = err.message
      saveProgress(progress)
      failed++
    }
  }
  
  console.log(`   Done: ${processed} generated, ${failed} failed`)
  return results
}

async function main() {
  // Parse command line args
  const levelArg = process.argv[2]
  let levels = [1, 2, 3, 4, 5, 6]
  
  if (levelArg) {
    levels = levelArg.split(',').map(l => parseInt(l.trim())).filter(l => l >= 1 && l <= 6)
    if (levels.length === 0) {
      console.error('Invalid level. Use 1-6 or comma-separated like "1,2,3"')
      process.exit(1)
    }
  }
  
  // Check API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable not set')
    console.error('Usage: OPENAI_API_KEY=sk-... node scripts/generate-hsk-decks.js [level]')
    process.exit(1)
  }
  
  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }
  
  // Load HSK word list
  const hskPath = join(DATA_DIR, 'hsk.json')
  const hskWords = JSON.parse(readFileSync(hskPath, 'utf-8'))
  
  console.log('🀄 HSK Flashcard Generator')
  console.log(`   Levels to process: ${levels.join(', ')}`)
  console.log(`   Total words in selected levels: ${hskWords.filter(w => levels.includes(w.level)).length}`)
  
  // Load dictionaries
  console.log('\n📖 Loading dictionaries...')
  loadCedict()
  console.log(`   CEDICT: ${cedictEntries.size} entries`)
  loadIds()
  console.log(`   IDS: ${idsEntries.size} entries`)
  
  // Load progress
  const progress = loadProgress()
  
  // Process each level
  const startTime = Date.now()
  
  for (const level of levels) {
    await processLevel(level, hskWords, progress)
  }
  
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
  console.log(`\n🎉 Complete! Total time: ${elapsed} minutes`)
  console.log(`   Output files in: ${OUTPUT_DIR}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
