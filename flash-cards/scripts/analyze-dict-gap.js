/**
 * Analyze words present in pinyin-pro but missing from CC-CEDICT
 */
import complete from '@pinyin-pro/data/complete.json' with { type: 'json' };
import fs from 'fs';

// Check specific word
const testWord = '很大';
console.log('Testing:', testWord, complete[testWord]);

// Get high-frequency 2-char words from pinyin-pro
const words = Object.entries(complete)
  .filter(([w, v]) => w.length === 2 && v[1] > 5e-10)  // freq > 5e-10 (lower threshold)
  .map(([w, v]) => ({ word: w, prob: v[1], pinyin: v[0] }))
  .sort((a, b) => b.prob - a.prob)
  .slice(0, 500);

// Load CEDICT
const cedict = fs.readFileSync('data/cedict.txt', 'utf-8');

// Check which are missing (look for the word followed by space - simplified form)
const missing = words.filter(({word}) => {
  // CEDICT format: Traditional Simplified [pinyin] /def/
  // Match "Simplified " or at start as Traditional
  const regex1 = new RegExp(`^[^ ]+ ${word} \\[`, 'm');
  const regex2 = new RegExp(`^${word} ${word} \\[`, 'm');
  return !regex1.test(cedict) && !regex2.test(cedict);
});

console.log(`\nTop ${words.length} frequent 2-char words from pinyin-pro:`);
console.log(`Missing from CEDICT: ${missing.length}\n`);

// Categorize the missing words
const categories = {
  adverbAdj: [], // 很+adj patterns
  verbObject: [], // common verb-object
  numbers: [],
  other: []
};

missing.forEach(w => {
  if (/^很/.test(w.word)) categories.adverbAdj.push(w);
  else if (/^\d|[一二三四五六七八九十百千万亿]/.test(w.word)) categories.numbers.push(w);
  else categories.other.push(w);
});

console.log('Adverb+Adj patterns (很+X):');
categories.adverbAdj.slice(0, 15).forEach(w => console.log(`  ${w.word} (${w.pinyin})`));

console.log('\nNumber-related:');
categories.numbers.slice(0, 10).forEach(w => console.log(`  ${w.word} (${w.pinyin})`));

console.log('\nOther missing:');
categories.other.slice(0, 30).forEach(w => console.log(`  ${w.word} (${w.pinyin})`));
