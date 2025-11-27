#!/usr/bin/env node
/**
 * Pre-converts numbered pinyin to tone marks in CEDICT file
 * Run: node scripts/convert-pinyin.js
 * 
 * Converts: 傳統 传统 [chuan2 tong3] /tradition/
 * To:       傳統 传统 [chuán tǒng] /tradition/
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const toneMarks = {
  a: ['ā', 'á', 'ǎ', 'à', 'a'],
  e: ['ē', 'é', 'ě', 'è', 'e'],
  i: ['ī', 'í', 'ǐ', 'ì', 'i'],
  o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
  u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
  v: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü']
}

function convertSyllable(syllable) {
  const toneMatch = syllable.match(/([1-5])$/)
  if (!toneMatch) return syllable
  
  const tone = parseInt(toneMatch[1]) - 1
  const isCapitalized = syllable[0] === syllable[0].toUpperCase() && syllable[0] !== syllable[0].toLowerCase()
  let base = syllable.slice(0, -1).toLowerCase()
  
  if (!base) return syllable
  
  // Handle ü written as v
  base = base.replace(/v/g, 'ü')
  
  // Find vowel to mark (priority: a, e, ou, else last vowel)
  const vowelOrder = ['a', 'e', 'ou']
  for (const v of vowelOrder) {
    if (base.includes(v)) {
      if (v === 'ou') {
        base = base.replace('o', toneMarks.o[tone])
      } else {
        base = base.replace(v, toneMarks[v][tone])
      }
      return isCapitalized ? base[0].toUpperCase() + base.slice(1) : base
    }
  }
  
  // Mark last vowel
  for (let i = base.length - 1; i >= 0; i--) {
    const char = base[i]
    if (toneMarks[char]) {
      base = base.slice(0, i) + toneMarks[char][tone] + base.slice(i + 1)
      return isCapitalized ? base[0].toUpperCase() + base.slice(1) : base
    }
  }
  
  return isCapitalized ? base[0].toUpperCase() + base.slice(1) : base
}

function convertPinyin(pinyin) {
  return pinyin.split(' ').map(convertSyllable).join(' ')
}

function convertLine(line) {
  // Skip comments and empty lines
  if (!line || line.startsWith('#')) return line
  
  // Match pinyin in brackets: [pin1 yin1]
  return line.replace(/\[([^\]]+)\]/g, (match, pinyin) => {
    return `[${convertPinyin(pinyin)}]`
  })
}

function main() {
  const inputPath = join(__dirname, '../data/cedict.txt')
  const outputPath = join(__dirname, '../data/cedict-tones.txt')
  
  console.log('Reading:', inputPath)
  const content = readFileSync(inputPath, 'utf-8')
  const lines = content.split('\n')
  
  console.log(`Processing ${lines.length} lines...`)
  const converted = lines.map(convertLine)
  
  writeFileSync(outputPath, converted.join('\n'), 'utf-8')
  console.log('Written:', outputPath)
  
  // Show sample conversions
  console.log('\nSample conversions:')
  const samples = lines.filter(l => l && !l.startsWith('#')).slice(0, 5)
  for (const sample of samples) {
    console.log('  Before:', sample.slice(0, 80))
    console.log('  After: ', convertLine(sample).slice(0, 80))
    console.log()
  }
}

main()
