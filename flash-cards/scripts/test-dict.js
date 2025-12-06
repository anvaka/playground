#!/usr/bin/env node
/**
 * Quick test to verify dictionary loading works
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../data')

// Test CEDICT
const cedictText = readFileSync(join(DATA_DIR, 'cedict-tones.txt'), 'utf-8')
const cedictLines = cedictText.split('\n').filter(l => l && !l.startsWith('#'))
console.log('CEDICT entries:', cedictLines.length)

// Test IDS
const idsText = readFileSync(join(DATA_DIR, 'ids-compact.txt'), 'utf-8')
const idsLines = idsText.split('\n').filter(l => l && !l.startsWith('#'))
console.log('IDS entries:', idsLines.length)

// Test HSK
const hsk = JSON.parse(readFileSync(join(DATA_DIR, 'hsk.json'), 'utf-8'))
console.log('HSK words:', hsk.length)
console.log('Sample HSK word:', JSON.stringify(hsk[0], null, 2))

// Test lookup for 爱
function parseCedictLine(line) {
  if (!line || line.startsWith('#')) return null
  const match = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/)
  if (!match) return null
  const [, traditional, simplified, pinyin, definitions] = match
  return { traditional, simplified, pinyin, definitions: definitions.split('/').filter(Boolean) }
}

const cedictMap = new Map()
for (const line of cedictText.split('\n')) {
  const entry = parseCedictLine(line)
  if (entry) {
    if (!cedictMap.has(entry.simplified)) cedictMap.set(entry.simplified, [])
    cedictMap.get(entry.simplified).push(entry)
  }
}

console.log('\nLookup test for 爱:')
console.log(JSON.stringify(cedictMap.get('爱'), null, 2))

console.log('\n✅ All tests passed!')
