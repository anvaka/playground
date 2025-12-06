#!/usr/bin/env node
/**
 * Test the HSK generator with just 2 words to verify API integration
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../data')

// ============ Dictionary ============

let cedictEntries = null
let idsEntries = null

function parseCedictLine(line) {
  if (!line || line.startsWith('#')) return null
  const match = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/)
  if (!match) return null
  const [, traditional, simplified, pinyin, definitions] = match
  return { traditional, simplified, pinyin, definitions: definitions.split('/').filter(Boolean), raw: line }
}

function parseIdsLine(line) {
  if (!line || line.startsWith('#')) return null
  const parts = line.split('\t')
  if (parts.length < 2) return null
  return { character: parts[0], decomposition: parts[1] }
}

function loadCedict() {
  if (cedictEntries) return cedictEntries
  const text = readFileSync(join(DATA_DIR, 'cedict-tones.txt'), 'utf-8')
  cedictEntries = new Map()
  for (const line of text.split('\n')) {
    const entry = parseCedictLine(line)
    if (entry) {
      if (!cedictEntries.has(entry.simplified)) cedictEntries.set(entry.simplified, [])
      cedictEntries.get(entry.simplified).push(entry)
    }
  }
  return cedictEntries
}

function loadIds() {
  if (idsEntries) return idsEntries
  const text = readFileSync(join(DATA_DIR, 'ids-compact.txt'), 'utf-8')
  idsEntries = new Map()
  for (const line of text.split('\n')) {
    const entry = parseIdsLine(line)
    if (entry) idsEntries.set(entry.character, entry)
  }
  return idsEntries
}

function lookupChinese(word) {
  loadCedict()
  loadIds()
  const cedictResults = cedictEntries.get(word) || []
  const idsResult = idsEntries.get(word)
  const componentIds = []
  if (word.length > 1) {
    for (const char of word) {
      const ids = idsEntries.get(char)
      if (ids) componentIds.push(ids)
    }
  }
  return { cedict: cedictResults, ids: idsResult, componentIds: componentIds.length ? componentIds : null }
}

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
  if (lookup.ids) parts.push(`\nComponent breakdown: ${lookup.ids.decomposition}`)
  if (lookup.componentIds) {
    parts.push('\nCharacter components:')
    for (const comp of lookup.componentIds) parts.push(`  ${comp.character}: ${comp.decomposition}`)
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
- Meaning: [full English definition, clear and comprehensive]
- Components: [explain the radicals/components and their meanings - use the dictionary data provided above if available]
- Examples: [2-3 example sentences in Chinese with pinyin and English translations]
- Memory story: [create a short, funny or shocking micro-story to help remember components, meaning and tone]

**IMAGE PROMPT:**
[Describe a simple, clear image that visually represents the word's meaning. No text in image. Focus on concrete, memorable visual elements. Keep under 50 words. Sci-fi futuristic style with networks is a plus]

Respond with valid JSON matching this schema:
{
  "pinyin": "...",
  "microClue": "...",
  "meaning": "...",
  "components": "...",
  "examples": [{"zh": "...", "pinyin": "...", "en": "..."}],
  "memoryStory": "...",
  "imagePrompt": "..."
}`
}

// ============ Test ============

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY not set')
    process.exit(1)
  }

  console.log('Loading dictionaries...')
  loadCedict()
  loadIds()
  console.log(`CEDICT: ${cedictEntries.size}, IDS: ${idsEntries.size}`)

  // Test with 爱
  const testWord = '爱'
  console.log(`\nTesting with: ${testWord}`)
  
  const lookup = lookupChinese(testWord)
  console.log('Lookup result:', JSON.stringify(lookup, null, 2))
  
  const dictContext = formatForLLM(lookup)
  console.log('\nFormatted for LLM:\n' + dictContext)
  
  const prompt = buildPrompt(testWord, dictContext)
  console.log('\n--- PROMPT ---')
  console.log(prompt)
  console.log('--- END PROMPT ---\n')

  console.log('Calling OpenAI API...')
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: 'You are a helpful Chinese language learning assistant. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('API Error:', response.status, error)
    process.exit(1)
  }

  const data = await response.json()
  console.log('\nAPI Response:')
  console.log('Usage:', data.usage)
  console.log('\nGenerated content:')
  console.log(data.choices[0].message.content)
  
  // Parse and validate
  const content = data.choices[0].message.content
  let parsed
  try {
    parsed = JSON.parse(content)
  } catch {
    const match = content.match(/\{[\s\S]*\}/)
    if (match) parsed = JSON.parse(match[0])
  }
  
  console.log('\n✅ Parsed successfully!')
  console.log(JSON.stringify(parsed, null, 2))
}

main().catch(console.error)
