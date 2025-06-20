import OpenAI from 'openai'
import fs from 'fs/promises'
import path from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function processTranscript(transcriptPath) {
  console.log('Starting processTranscript function...')
  console.log('Transcript path:', transcriptPath)
  
  if (!transcriptPath) {
    console.error('Usage: node openai_transcribe.js <path-to-transcript-file>')
    console.error('Make sure to set OPENAI_API_KEY environment variable')
    process.exit(1)
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is not set')
    process.exit(1)
  }
  
  console.log('API key found, proceeding...')

  try {
    const content = await fs.readFile(transcriptPath, 'utf-8')
    console.log(`Input file size: ${content.length} characters`)
    
    const { metadata, transcriptText } = parseTranscript(content)
    console.log(`Transcript text size: ${transcriptText.length} characters`)
    
    console.log(`Processing: ${metadata.title}`)
    console.log(`Video ID: ${metadata.videoId}`)
    
    const reformattedTranscript = await reformatWithOpenAI(transcriptText)
    
    const fullOutput = createOutputWithHeader(metadata, reformattedTranscript)
    
    const outputPath = generateOutputPath(transcriptPath)
    await fs.writeFile(outputPath, fullOutput)
    
    console.log(`Processed transcript saved to: ${outputPath}`)
  } catch (error) {
    console.error('Error processing transcript:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

function parseTranscript(content) {
  const lines = content.split('\n')
  const separatorIndex = lines.findIndex(line => line.includes('---'))
  
  if (separatorIndex === -1) {
    throw new Error('Invalid transcript format: no separator found')
  }
  
  const headerLines = lines.slice(0, separatorIndex)
  const transcriptLines = lines.slice(separatorIndex + 1)
  
  const metadata = extractMetadata(headerLines)
  const transcriptText = transcriptLines.join('\n').trim()
  
  return { metadata, transcriptText }
}

function extractMetadata(headerLines) {
  const metadata = {}
  
  for (const line of headerLines) {
    if (line.startsWith('Video: ')) {
      metadata.title = line.substring(7)
    } else if (line.startsWith('Video ID: ')) {
      metadata.videoId = line.substring(10)
    } else if (line.startsWith('URL: ')) {
      metadata.url = line.substring(5)
    }
  }
  
  return metadata
}

async function reformatWithOpenAI(transcriptText) {
  console.log(`Input text length: ${transcriptText.length} characters`)
  
  if (transcriptText.length > 200000) {
    console.log('Large transcript detected, using chunked processing for reliability...')
    return await reformatWithChunking(transcriptText)
  }
  
  console.log('Processing entire transcript in single request (1M token context)...')
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: createSystemPrompt()
        },
        {
          role: 'user',
          content: transcriptText
        }
      ],
      temperature: 0.1,
      max_tokens: 32000
    })
    
    console.log('Response finish_reason:', completion.choices[0].finish_reason)
    console.log('Response length:', completion.choices[0].message.content.length)
    console.log('Input length:', transcriptText.length)
    console.log('Usage:', completion.usage)
    
    return completion.choices[0].message.content.trim()
    
  } catch (error) {
    console.error('Error processing transcript:', error.message)
    console.log('Falling back to chunked processing...')
    return await reformatWithChunking(transcriptText)
  }
}

async function reformatWithChunking(transcriptText) {
  const chunks = splitIntoChunks(transcriptText, 50000)
  const reformattedChunks = []
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${chunks.length}...`)
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: createSystemPrompt()
          },
          {
            role: 'user',
            content: chunks[i]
          }
        ],
        temperature: 0.1,
        max_tokens: 16000
      })
      
      console.log(`Chunk ${i + 1} finish_reason:`, completion.choices[0].finish_reason)
      console.log(`Chunk ${i + 1} response length:`, completion.choices[0].message.content.length)
      console.log(`Chunk ${i + 1} input length:`, chunks[i].length)
      if (completion.usage) {
        console.log(`Chunk ${i + 1} usage:`, completion.usage)
      }
      
      const result = completion.choices[0].message.content.trim()
      reformattedChunks.push(result)
      
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error.message)
      throw error
    }
  }
  
  return reformattedChunks.join('\n')
}

function createSystemPrompt() {
  return `You are a transcript formatter. Your task is to reformat the ENTIRE transcript that follows into complete sentences.

CRITICAL REQUIREMENTS:
1. Process the COMPLETE transcript - do not stop early or summarize
2. Combine fragments that belong to the same sentence across multiple timestamps
3. Keep the EXACT original words - do not paraphrase, interpret, or add content
4. Remove only obvious filler words: "um", "uh", "ah", "er"
5. Each complete sentence should be on its own line
6. Use the timestamp from where the sentence begins
7. Do not add punctuation that changes meaning
8. Do not add explanatory text, commentary, or interpretations
9. Process EVERY line of the input transcript
10. Your output should be much longer than the input since you're reformatting

IMPORTANT: You must process the ENTIRE transcript from beginning to end. Do not stop after a few sentences.

OUTPUT FORMAT for EVERY sentence in the transcript:
[MM:SS] Complete sentence using exact original words
[MM:SS] Another complete sentence using exact original words

Continue until you have processed EVERY timestamp in the input.`
}

function createOutputWithHeader(metadata, processedTranscript) {
  const headerLines = []
  
  if (metadata.title) {
    headerLines.push(`Video: ${metadata.title}`)
  }
  if (metadata.videoId) {
    headerLines.push(`Video ID: ${metadata.videoId}`)
  }
  if (metadata.url) {
    headerLines.push(`URL: ${metadata.url}`)
  }
  
  headerLines.push('Transcript Type: Processed by OpenAI GPT-4.1-mini')
  headerLines.push('Language: English (processed)')
  headerLines.push('--------------------------------------------------------------------------------')
  headerLines.push('')
  
  return headerLines.join('\n') + processedTranscript
}

function splitIntoChunks(text, chunkSize) {
  const chunks = []
  const lines = text.split('\n').filter(line => line.trim())
  let currentChunk = []
  let currentSize = 0
  
  for (const line of lines) {
    const lineSize = line.length + 1
    
    if (currentSize + lineSize > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'))
      currentChunk = [line]
      currentSize = lineSize
    } else {
      currentChunk.push(line)
      currentSize += lineSize
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'))
  }
  
  return chunks
}

function generateOutputPath(inputPath) {
  const dir = path.dirname(inputPath)
  const name = path.basename(inputPath, path.extname(inputPath))
  return path.join(dir, `${name}_openai_processed.txt`)
}

const transcriptPath = process.argv[2]
processTranscript(transcriptPath)
