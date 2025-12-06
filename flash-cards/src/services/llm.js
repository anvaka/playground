/**
 * LLM service for generating flashcard content
 * Uses @anvaka/vue-llm for provider management
 */

/**
 * Build the prompt for vocabulary card generation (dictionary match exists)
 */
export function buildPrompt(word, dictContext) {
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

/**
 * Build prompt for freeform input (no dictionary match)
 * LLM determines card type: phrase, trivia, or vocabulary (for pinyin input)
 */
export function buildFreeformPrompt(input) {
  return `You are a Chinese language learning assistant. The user entered something that isn't in the standard dictionary.

USER INPUT: "${input}"

Analyze the input and create an appropriate flashcard:

1. If it looks like PINYIN (romanized Chinese) → convert to characters and create a vocabulary card
2. If it's a CHINESE PHRASE or sentence → create a phrase card  
3. If it's a QUESTION about Chinese language/culture/etymology → create a trivia card

Choose ONE of these JSON formats:

FOR VOCABULARY (pinyin input converted to characters):
{
  "type": "vocabulary",
  "character": "Chinese characters",
  "pinyin": "pinyin with tone marks (e.g., nǐ hǎo)",
  "microClue": "3-6 word hint",
  "translation": "concise dictionary-style, max 10 words",
  "meaning": "full English definition",
  "components": "breakdown of radicals/parts if single character, or word-by-word for compounds",
  "examples": [{"zh": "example sentence", "pinyin": "pinyin", "en": "English"}],
  "relatedWords": [{"zh": "...", "pinyin": "...", "en": "..."}],
  "memoryStory": "memorable mnemonic story",
  "imagePrompt": "Describe a simple, clear image that visually represents the word's meaning. No text in image. Focus on concrete, memorable visual elements. Keep under 50 words. Sci-fi futuristic style with networks is a plus"
}

FOR PHRASE (Chinese sentence/expression):
{
  "type": "phrase",
  "character": "the Chinese phrase",
  "pinyin": "full pinyin with tone marks",
  "microClue": "when to use this",
  "translation": "concise translation, max 10 words",
  "meaning": "English translation with context",
  "components": "word-by-word breakdown with pinyin: 你(nǐ, you) + 好(hǎo, good) = hello",
  "examples": [{"zh": "example in context", "pinyin": "pinyin", "en": "English"}],
  "relatedWords": [{"zh": "...", "pinyin": "...", "en": "..."}],
  "memoryStory": "memorable way to remember this phrase",
  "imagePrompt": "Describe a simple, clear image showing the situation where this phrase would be used. No text in image. Focus on concrete, memorable visual elements. Keep under 50 words. Sci-fi futuristic style with networks is a plus"
}

FOR TRIVIA (question about Chinese):
{
  "type": "trivia",
  "question": "the question being answered (include any Chinese with pinyin)",
  "answer": "concise 1-2 sentence answer",
  "explanation": "detailed explanation (include pinyin for any Chinese characters)",
  "relatedWords": [{"zh": "相关", "pinyin": "xiāng guān", "en": "related"}],
  "memoryStory": "memorable way to remember this fact",
  "imagePrompt": "Describe a simple, clear image that captures the key insight or concept of this answer. No text in image. Focus on concrete, memorable visual elements. Keep under 50 words. Sci-fi futuristic style with networks is a plus"
}

IMPORTANT: Always include pinyin with tone marks for any Chinese text.

Respond with valid JSON matching ONE schema above.`
}

/**
 * Validate LLM response has required fields based on card type
 */
export function validateCardData(data) {
  const type = data.type || 'vocabulary'
  
  const schemas = {
    vocabulary: ['pinyin', 'microClue', 'meaning', 'components', 'examples', 'memoryStory'],
    phrase: ['character', 'pinyin', 'meaning', 'components', 'memoryStory'],
    trivia: ['question', 'answer', 'explanation']
  }
  
  const required = schemas[type]
  if (!required) {
    throw new Error(`Unknown card type: ${type}`)
  }
  
  const missing = required.filter(field => !data[field])
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`)
  }
  
  // Validate examples array for vocabulary and phrase cards
  if ((type === 'vocabulary' || type === 'phrase') && data.examples) {
    if (!Array.isArray(data.examples) || data.examples.length === 0) {
      throw new Error('Examples must be a non-empty array')
    }
  }
  
  return true
}

/**
 * Parse LLM response, extracting JSON from potential markdown wrapper
 */
export function parseResponse(content) {
  // Try direct parse first
  try {
    return JSON.parse(content)
  } catch {
    // Extract JSON from markdown code blocks or surrounding text
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid response format: no JSON found')
    }
    return JSON.parse(jsonMatch[0])
  }
}
