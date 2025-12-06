/**
 * Translation Prompt Testbench
 * 
 * Tests multiple prompt variations for Chinese translation at different proficiency levels.
 * Run with: node scripts/test-translation-prompts.js
 * 
 * Requires: OPENAI_KEY environment variable
 */

import OpenAI from 'openai'
import fs from 'fs'

// Sample texts for testing - diverse genres and styles
const SAMPLE_TEXTS = {
  // Classic literature - Robinson Crusoe (narrative, adventure)
  robinson_crusoe: {
    name: 'Robinson Crusoe (Classic Adventure)',
    text: `I was born in the year 1632, in the city of York, of a good family,
though not of that country, my father being a foreigner of Bremen, who
settled first at Hull. He got a good estate by merchandise, and leaving
off his trade, lived afterwards at York, from whence he had married my
mother, whose relations were named Robinson, a very good family in that
country, and from whom I was called Robinson Kreutznaer; but, by the
usual corruption of words in England, we are now called—nay, we call
ourselves and write our name—Crusoe; and so my companions always called
me.

I had two elder brothers, one of whom was lieutenant-colonel to an
English regiment of foot in Flanders, formerly commanded by the famous
Colonel Lockhart, and was killed at the battle near Dunkirk against the
Spaniards. What became of my second brother I never knew, any more than
my father or mother knew what became of me.`
  },

  // Frankenstein - formal, first-person, determination/adventure
  frankenstein: {
    name: 'Frankenstein (Gothic/Determined)',
    text: `Six years have passed since I resolved on my present undertaking. I
can, even now, remember the hour from which I dedicated myself to this
great enterprise. I commenced by inuring my body to hardship. I
accompanied the whale-fishers on several expeditions to the North Sea;
I voluntarily endured cold, famine, thirst, and want of sleep; I often
worked harder than the common sailors during the day and devoted my
nights to the study of mathematics, the theory of medicine, and those
branches of physical science from which a naval adventurer might derive
the greatest practical advantage. Twice I actually hired myself as an
under-mate in a Greenland whaler, and acquitted myself to admiration. I
must own I felt a little proud when my captain offered me the second
dignity in the vessel and entreated me to remain with the greatest
earnestness, so valuable did he consider my services.`
  },

  // Winnie the Pooh - playful, action, humor, onomatopoeia
  winnie_pooh: {
    name: 'Winnie the Pooh (Playful/Humor)',
    text: `_Crack!_

"Oh, help!" said Pooh, as he dropped ten feet on the branch below him.

"If only I hadn't----" he said, as he bounced twenty feet on to the next
branch.

"You see, what I _meant_ to do," he explained, as he turned
head-over-heels, and crashed on to another branch thirty feet below,
"what I _meant_ to do----"

"Of course, it _was_ rather----" he admitted, as he slithered very
quickly through the next six branches.

"It all comes, I suppose," he decided, as he said good-bye to the last
branch, spun round three times, and flew gracefully into a gorse-bush,
"it all comes of _liking_ honey so much. Oh, help!"`
  },

  // Math puzzle - logical, structured, numbers
  math_puzzle: {
    name: 'Math Puzzle (Logic/Numbers)',
    text: `7.--THE WIDOW'S LEGACY.

A gentleman who recently died left the sum of L8,000 to be divided among
his widow, five sons, and four daughters. He directed that every son
should receive three times as much as a daughter, and that every
daughter should have twice as much as their mother. What was the widow's
share?`
  },

  // News article style - factual, informative
  news_article: {
    name: 'News Article (Factual)',
    text: `Scientists announced yesterday that they have discovered a new species 
of deep-sea fish living near underwater volcanoes in the Pacific Ocean. 
The fish, which glows bright blue in the dark water, can survive in 
temperatures that would kill most other creatures. Dr. Sarah Chen, who 
led the research team, said the discovery could help scientists understand 
how life adapts to extreme environments. The team plans to return next 
year to study the fish further and search for other unknown species in 
the area.`
  },

  // Modern casual blog - conversational, personal
  blog_post: {
    name: 'Blog Post (Casual/Modern)',
    text: `So I finally tried that new coffee shop everyone's been talking about. 
Honestly? It's pretty good, but maybe not worth the 45-minute wait. The 
latte art was Instagram-worthy though, and the barista was super friendly. 
She recommended their seasonal pumpkin spice blend, which I normally hate, 
but this one was actually delicious. Would I go back? Probably, but only 
on a weekday morning when it's less crowded. Pro tip: they have a secret 
menu if you ask nicely!`
  },

  // Children's story - simple, imaginative
  childrens_story: {
    name: "Children's Story (Simple)",
    text: `Once upon a time, there was a little rabbit named Luna who lived in a 
cozy burrow under an old oak tree. Every morning, she would hop through 
the meadow to visit her best friend, a wise old owl named Oliver. One day, 
Luna found a mysterious golden key in the grass. "What does this open?" 
she wondered. Oliver looked at the key carefully and said, "This is the 
key to the Secret Garden. But be careful - the garden is full of magic!"`
  },

  // Technical/instructional - procedural
  instructions: {
    name: 'Instructions (Technical)',
    text: `To set up your new wireless router, first unplug your old router and 
modem. Wait 30 seconds, then connect the new router to your modem using 
the included ethernet cable. Plug in the power adapter and wait for the 
lights to turn solid green. On your phone or computer, look for the 
network name printed on the bottom of the router. Enter the password, 
also found on the router label. Once connected, open a web browser to 
complete the setup process.`
  },

  // Philosophical/abstract - complex ideas
  philosophical: {
    name: 'Philosophical (Abstract)',
    text: `The concept of happiness has puzzled philosophers for thousands of years. 
Some believe happiness comes from pleasure and avoiding pain. Others argue 
that true happiness requires living a meaningful life, even if it involves 
struggle and sacrifice. Perhaps the answer lies somewhere in between - we 
need both simple joys and deeper purpose. What makes you happy might be 
different from what makes me happy, and that's perfectly fine. The search 
for happiness is, itself, part of the human experience.`
  }
}

// Prompts to test
const PROMPTS = {
  // Current production (baseline)
  current: {
    name: 'Current Production',
    build: (text) => `You are translating text for a Chinese language learner at hsk1-2 level.

<textToTranslate>
${text}
</textToTranslate>

Guidelines for hsk1-2:
Use only basic vocabulary (~300 most common words). Simple sentence structures. Short sentences.

IMPORTANT: Translate ONLY the text within <textToTranslate> tags.

Return the Chinese translation only, no explanations or tags.`
  },

  // Final candidate - combines best elements
  final: {
    name: 'Final Candidate',
    build: (text) => `Rewrite this in simple Chinese for beginners (HSK 1-2 level, ~300 basic words).

Guidelines:
- Natural sentence flow, not fragmented
- Keep the original style and tone
- Simplify or skip complex details
- Combine related ideas into single sentences

${text}

Chinese version:`
  }
}

async function testPrompt(client, promptConfig, text) {
  const prompt = promptConfig.build(text)
  
  const startTime = Date.now()
  
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-5.1',
      messages: [{ role: 'user', content: prompt }],
      temperature: 1,
      max_completion_tokens: 2000
    })
    
    const elapsed = Date.now() - startTime
    const result = response.choices[0].message.content.trim()
    
    return {
      success: true,
      result,
      elapsed,
      tokens: response.usage
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      elapsed: Date.now() - startTime
    }
  }
}

function formatResults(results, sampleName, sampleText) {
  let output = '\n' + '='.repeat(80) + '\n'
  output += `SAMPLE: ${sampleName}\n`
  output += '='.repeat(80) + '\n\n'
  
  output += 'SOURCE TEXT:\n'
  output += '-'.repeat(40) + '\n'
  output += sampleText.slice(0, 500) + (sampleText.length > 500 ? '...' : '') + '\n\n'
  
  for (const [key, data] of Object.entries(results)) {
    output += '-'.repeat(80) + '\n'
    output += `PROMPT: ${data.name}\n`
    output += '-'.repeat(40) + '\n'
    
    if (data.success) {
      output += `Time: ${data.elapsed}ms | Tokens: ${data.tokens?.total_tokens || 'N/A'}\n\n`
      output += data.result + '\n'
    } else {
      output += `ERROR: ${data.error}\n`
    }
    output += '\n'
  }
  
  return output
}

async function main() {
  const apiKey = process.env.OPENAI_KEY
  
  if (!apiKey) {
    console.error('Error: OPENAI_KEY environment variable is required')
    console.error('Usage: OPENAI_KEY=your-key node scripts/test-translation-prompts.js')
    process.exit(1)
  }
  
  const client = new OpenAI({ apiKey })
  
  // Parse command line args for specific sample
  const requestedSample = process.argv[2]
  const samplesToTest = requestedSample 
    ? { [requestedSample]: SAMPLE_TEXTS[requestedSample] }
    : SAMPLE_TEXTS
  
  if (requestedSample && !SAMPLE_TEXTS[requestedSample]) {
    console.error(`Unknown sample: ${requestedSample}`)
    console.error('Available samples:', Object.keys(SAMPLE_TEXTS).join(', '))
    process.exit(1)
  }
  
  console.log('Testing translation prompts...\n')
  console.log('Samples:', Object.keys(samplesToTest).join(', '))
  console.log('Prompts:', Object.keys(PROMPTS).length, '\n')
  
  let fullOutput = '# Translation Prompt Test Results\n\n'
  fullOutput += `Generated: ${new Date().toISOString()}\n\n`
  
  for (const [sampleKey, sample] of Object.entries(samplesToTest)) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing sample: ${sample.name}`)
    console.log('='.repeat(60))
    
    const results = {}
    
    for (const [promptKey, promptConfig] of Object.entries(PROMPTS)) {
      console.log(`  Testing prompt: ${promptConfig.name}...`)
      results[promptKey] = {
        name: promptConfig.name,
        ...await testPrompt(client, promptConfig, sample.text)
      }
    }
    
    const output = formatResults(results, sample.name, sample.text)
    console.log(output)
    fullOutput += output
  }
  
  // Save results to file
  const outputPath = 'scripts/translation-test-results.md'
  fs.writeFileSync(outputPath, fullOutput)
  console.log(`\nResults saved to ${outputPath}`)
}

main().catch(console.error)
