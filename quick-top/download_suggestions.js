#!/usr/bin/env node
import { copyFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE_URL = 'https://api.audible.com/1.0/searchsuggestions'
const SITE_VARIANT = 'desktop'
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')
const PAUSE_MS = 1000

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DATA_FILE = join(__dirname, 'public', 'audible-suggestions.json')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchSuggestions(letter) {
  const url = `${BASE_URL}?key_strokes=${letter}&site_variant=${SITE_VARIANT}`
  const response = await fetch(url, {
    headers: {
      'user-agent': 'quick-top/1.0 (+https://github.com/anvaka)'
    }
  })

  if (!response.ok) {
    throw new Error(`Request for "${letter}" failed with status ${response.status}`)
  }

  return response.json()
}

async function main() {
  const payload = {
    timestamp: new Date().toISOString(),
    letters: {}
  }

  for (const letter of LETTERS) {
    console.log(`Fetching suggestions for "${letter}"...`)
    payload.letters[letter] = await fetchSuggestions(letter)

    if (letter !== LETTERS[LETTERS.length - 1]) {
      await sleep(PAUSE_MS)
    }
  }

  const timestampSuffix = payload.timestamp.replace(/[:.]/g, '-')
  const outputFile = `audible-suggestions-${timestampSuffix}.json`
  await writeFile(outputFile, JSON.stringify(payload, null, 2), 'utf8')
  console.log(`Saved all suggestions to ${outputFile}`)

  await copyFile(outputFile, PUBLIC_DATA_FILE)
  console.log('Updated public/audible-suggestions.json for the web app')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
