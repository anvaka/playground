/**
 * Card markdown service - handles parsing and rendering of markdown-based cards
 */

import { marked } from 'marked'

// Custom renderer for card:// image URLs
// Outputs a placeholder src with data-card-src for async resolution
const cardImageRenderer = {
  image(token) {
    const { href, title, text } = token
    if (href && href.startsWith('card://')) {
      // Use transparent 1x1 gif as placeholder, store real URL in data attribute
      const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
      const titleAttr = title ? ` title="${escapeAttr(title)}"` : ''
      return `<img src="${placeholder}" data-card-src="${escapeAttr(href)}" alt="${escapeAttr(text)}"${titleAttr} class="card-image-pending">`
    }
    // Default rendering for normal images
    const titleAttr = title ? ` title="${escapeAttr(title)}"` : ''
    return `<img src="${escapeAttr(href)}" alt="${escapeAttr(text)}"${titleAttr}>`
  }
}

// Configure marked for streaming-friendly output (marked v5+ API)
marked.use({
  gfm: true,
  breaks: true,
  async: false, // Ensure synchronous parsing
  renderer: cardImageRenderer
})

/**
 * Escape HTML attribute value
 */
function escapeAttr(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Parse card markdown into structured sections
 * @param {string} markdown - Raw card markdown
 * @returns {Object} Parsed sections { front, hint, back, examples, related, meaning, components }
 */
export function parseCardSections(markdown) {
  if (!markdown) return {}
  
  const sections = {}
  const lines = markdown.split('\n')
  let currentSection = null
  let currentContent = []
  
  const sectionMap = {
    '# front': 'front',
    '#front': 'front',
    '# hint': 'hint',
    '#hint': 'hint',
    '# back': 'back',
    '#back': 'back',
    '## hint': 'hint',
    '##hint': 'hint',
    '## examples': 'examples',
    '##examples': 'examples',
    '## related': 'related',
    '##related': 'related',
    '## meaning': 'meaning',
    '##meaning': 'meaning',
    '## components': 'components',
    '##components': 'components',
    '## memory': 'memory',
    '##memory': 'memory',
    '## image': 'image',
    '##image': 'image',
    '## answer': 'answer',
    '##answer': 'answer',
    '## pattern': 'pattern',
    '##pattern': 'pattern',
    '## usage': 'usage',
    '##usage': 'usage',
    '## contrast': 'contrast',
    '##contrast': 'contrast'
  }
  
  function saveSection() {
    if (currentSection) {
      sections[currentSection] = currentContent.join('\n').trim()
    }
  }
  
  for (const line of lines) {
    const lower = line.toLowerCase().replace(/\s+/g, '')
    const sectionKey = Object.keys(sectionMap).find(key => lower.startsWith(key))
    
    if (sectionKey) {
      saveSection()
      currentSection = sectionMap[sectionKey]
      currentContent = []
    } else {
      currentContent.push(line)
    }
  }
  
  saveSection()
  return sections
}

/**
 * Extract front info (character, pinyin) from front section
 * @param {string} frontSection - Content of the #Front section
 * @returns {Object} { character, pinyin }
 */
export function extractFrontInfo(frontSection) {
  if (!frontSection) return { character: '', pinyin: '' }
  
  // First line is typically the character with pinyin
  const lines = frontSection.trim().split('\n')
  if (lines.length === 0) return { character: '', pinyin: '' }
  
  const firstLine = lines[0].trim()
  
  // Pattern: 跑步 (pǎo bù) or just 跑步
  const match = firstLine.match(/^(.+?)\s*(?:\(([^)]+)\))?$/)
  if (match) {
    return {
      character: match[1].trim(),
      pinyin: match[2]?.trim() || ''
    }
  }
  
  return { character: firstLine, pinyin: '' }
}

/**
 * Regex to match Chinese text sequences (CJK Unified Ideographs + common punctuation)
 * Captures meaningful phrases, not single characters
 */
const CHINESE_PHRASE_REGEX = /([\u4e00-\u9fff][\u4e00-\u9fff\u3000-\u303f\uff00-\uffef，。！？、；：""''（）]*)/g

/**
 * Inject small speak icons after Chinese text sequences
 * @param {string} html - Rendered HTML
 * @returns {string} HTML with speak icons
 */
function injectSpeakIcons(html) {
  // Don't inject inside HTML tags
  return html.replace(/>([^<]+)</g, (match, textContent) => {
    const withIcons = textContent.replace(CHINESE_PHRASE_REGEX, (phrase) => {
      // Only add icon if phrase has 2+ characters (skip single chars in context)
      if (phrase.length < 2) return phrase
      const encoded = encodeURIComponent(phrase)
      return `${phrase}<span class="inline-speak" data-speak="${encoded}" title="Listen">▸</span>`
    })
    return `>${withIcons}<`
  })
}

/**
 * Render markdown to HTML with streaming support
 * Handles partial markdown gracefully
 * @param {string} markdown - Raw markdown (possibly incomplete)
 * @param {Object} options - Render options
 * @param {boolean} options.speakIcons - Inject speak icons after Chinese text (default: true)
 * @returns {string} Rendered HTML
 */
export function renderMarkdown(markdown, options = {}) {
  if (!markdown) return ''
  
  const { speakIcons = true } = options
  
  try {
    let html = marked.parse(markdown)
    if (speakIcons) {
      html = injectSpeakIcons(html)
    }
    return html
  } catch {
    // Fallback for incomplete markdown during streaming
    return escapeHtml(markdown).replace(/\n/g, '<br>')
  }
}

/**
 * Render a specific section to HTML
 * @param {string} markdown - Full card markdown
 * @param {string} sectionName - Name of section to render
 * @returns {string} Rendered HTML for that section
 */
export function renderSection(markdown, sectionName) {
  const sections = parseCardSections(markdown)
  const content = sections[sectionName]
  return content ? renderMarkdown(content) : ''
}

/**
 * Escape HTML characters
 */
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Build initial card markdown from dictionary lookup
 * @param {string} character - Chinese character/word
 * @param {Object} dictLookup - Dictionary lookup result
 * @returns {string} Pre-filled markdown template
 */
export function buildCardTemplate(character, dictLookup) {
  const lines = []
  
  // Front section
  const cedict = dictLookup?.cedict?.[0]
  const pinyin = cedict?.pinyin || ''
  lines.push('# Front')
  lines.push(`${character}${pinyin ? ` (${pinyin})` : ''}`)
  lines.push('')
  
  // Hint section (placeholder)
  lines.push('## Hint')
  lines.push('*...*')
  lines.push('')
  
  // Back section
  lines.push('# Back')
  lines.push('')
  
  // Image placeholder
  lines.push('## Image')
  lines.push('...')
  lines.push('')
  
  // Examples placeholder
  lines.push('## Examples')
  lines.push('- ...')
  lines.push('')
  
  // Related placeholder
  lines.push('## Related')
  lines.push('- ...')
  lines.push('')
  
  // Meaning from dictionary
  if (cedict?.definitions?.length) {
    lines.push('## Meaning')
    lines.push(cedict.definitions.join('; '))
    lines.push('')
  }
  
  // Components from IDS
  if (dictLookup?.ids || dictLookup?.componentIds?.length) {
    lines.push('## Components')
    if (dictLookup.ids) {
      lines.push(`${character}: ${dictLookup.ids.decomposition}`)
    }
    if (dictLookup.componentIds) {
      for (const comp of dictLookup.componentIds) {
        lines.push(`- ${comp.character}: ${comp.decomposition}`)
      }
    }
    lines.push('')
  }
  
  return lines.join('\n')
}

/**
 * Shared card format guide - single source of truth for card generation
 * Used by both buildMarkdownPrompt and buildChatSystemPrompt
 */
export const CARD_FORMAT_GUIDE = `
<card-types>
  <type name="vocabulary">Single character or word</type>
  <type name="grammar">Pattern, structure, or construct (e.g., "多 + verb", "是...的")</type>
  <type name="phrase">Expression, greeting, colloquial usage</type>
</card-types>

<format type="vocabulary">
# Front
Word (pīnyīn with tone marks)

## Hint
*Retrieval cue, NOT a definition. 3-6 words max.*

# Back

## Image
A vivid scene depicting this word. Specific and memorable — unusual scenarios stick better. No text in image. Under 40 words.
Skip for abstract concepts.

## Meaning
Clear English definition.

## Examples
2-3 sentences showing natural usage:
- 中文句子。(Pīnyīn.) — Translation.

## Related
3-5 related words:
- 词 (cí) — meaning

## Components
Radicals and component meanings:
- 字 (zì): meaning
Include for characters and compounds.

## Usage
Register, regional, or frequency notes.
Include only when notable (e.g., formal vs casual, Taiwan vs Mainland).

## Contrast
Common confusions:
- Word A vs Word B — when to use each
Include only when learners commonly mix these up.
</format>

<format type="grammar">
# Front
Fill-in-the-blank sentence testing the pattern:
感冒了要___休息。(Gǎnmào le yào ___ xiūxi.)

## Hint
*Clue about the grammar function, not the answer itself.*
*e.g., "degree modifier" or "completed action marker"*

# Back

## Answer
多

## Pattern
多 + Verb = "do [verb] more"
Explain the structure, what it means, when to use it.

## Examples
2-3 more sentences using this pattern:
- 你多练习。(Nǐ duō liànxí.) — Practice more.

## Related
Similar or contrasting patterns:
- 再 (zài) — again
- 更 (gèng) — even more

## Contrast
多 vs 再 vs 更 — explain when to use each.
Include when there are common learner confusions.

## Usage
Register or formality notes. Include only if relevant.
</format>

<format type="phrase">
# Front
Phrase (pīnyīn)

## Hint
*Social situation or emotional tone — not the translation.*
*e.g., "casual greeting" or "expressing frustration"*

# Back

## Image
A scene capturing when this phrase is used. Skip if too abstract.

## Meaning
What it means and when to say it.

## Examples
Natural usage in context:
- 中文句子。(Pīnyīn.) — Translation.

## Related
Similar expressions:
- 相关 (xiāngguān) — meaning

## Usage
早安 is formal/written — people just say 早.
Include register, frequency, regional notes. This is often the most important part for phrases.
</format>

<guidelines>
- Pinyin must have tone marks (ā á ǎ à, etc.)
- Output markdown only, no code blocks
- Skip sections that don't apply — not every card needs every section
- Examples should sound natural, not textbook-formal
- Keep it concise — no walls of text
</guidelines>

<grammar-cloze-principle>
The blank tests what the learner must recall — always the grammar element itself.
Ask: "What grammar am I teaching?" That word/particle goes in the blank.
- Teaching 了? Blank the 了: 他走___。
- Teaching 多+V? Blank the 多: 你要___练习。
- Teaching 太...了 frame? Blank one frame marker: 太甜___！(Answer: 了)
Never blank the variable content (the verb, adjective, etc.) — that's not what we're testing.
</grammar-cloze-principle>
`

/**
 * Build unified LLM prompt for markdown card generation
 * Handles vocabulary, grammar patterns, and phrases
 * @param {string} input - Chinese character/word or user query
 * @param {string} dictContext - Formatted dictionary context
 * @returns {string} Prompt for LLM
 */
export function buildMarkdownPrompt(input, dictContext) {
  return `You are a Chinese language learning assistant creating a flashcard.

<input>${input}</input>
<dictionary>${dictContext || "Not found"}</dictionary>

Identify the content type, then use the matching format:

${CARD_FORMAT_GUIDE}`
}

/**
 * Build freeform prompt for non-dictionary input
 * Uses the same unified prompt as buildMarkdownPrompt
 * @param {string} input - User's freeform input
 * @returns {string} Prompt for LLM
 */
export function buildFreeformMarkdownPrompt(input) {
  // Use the unified prompt - it handles all content types
  return buildMarkdownPrompt(input, null)
}

/**
 * Extract character for indexing from markdown content
 * @param {string} markdown - Card markdown
 * @returns {string} Character/word for indexing
 */
export function extractCharacterForIndex(markdown) {
  const sections = parseCardSections(markdown)
  const { character } = extractFrontInfo(sections.front)
  return character
}


