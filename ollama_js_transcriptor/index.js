// Tried this to transcribe youtube videos with ollama and detect the sentences.
// Extremely poor results. Not sure what I'm doing wrong. Keeping for posterity.
import ollama from 'ollama'
import fs from 'fs/promises'
import path from 'path'

async function processTranscript(transcriptPath) {
  if (!transcriptPath) {
    console.error('Usage: node index.js <path-to-transcript-file>')
    process.exit(1)
  }

  try {
    const content = await fs.readFile(transcriptPath, 'utf-8')
    const { metadata, transcriptText } = parseTranscript(content)
    
    console.log(`Processing: ${metadata.title}`)
    console.log(`Video ID: ${metadata.videoId}`)
    
    const reformattedTranscript = await reformatWithLLM(transcriptText)
    
    const outputPath = generateOutputPath(transcriptPath)
    await fs.writeFile(outputPath, reformattedTranscript)
    
    console.log(`Processed transcript saved to: ${outputPath}`)
  } catch (error) {
    console.error('Error processing transcript:', error.message)
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

async function reformatWithLLM(transcriptText) {
  // Use smaller chunks to maintain precision
  const chunks = splitIntoChunks(transcriptText, 2000)
  const reformattedChunks = []
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${chunks.length}...`)
    
    const prompt = createConstrainedPrompt(chunks[i])
    
    try {
      const response = await ollama.chat({
        model: 'llama3.3:70b', // Specify 70B model explicitly
        messages: [{ role: 'user', content: prompt }],
        options: {
          temperature: 0.1, // Very low temperature for consistency
          top_p: 0.1,       // Low top_p for deterministic output
        }
      })
      
      reformattedChunks.push(response.message.content.trim())
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error.message)
      throw error
    }
  }
  
  return reformattedChunks.join('\n')
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

function createConstrainedPrompt(chunk) {
  return `You are a transcript formatter. Your ONLY job is to combine transcript fragments into complete sentences.

STRICT RULES:
- Use the EXACT words from the input
- Do NOT add, remove, or change any words except "um", "uh"
- Do NOT interpret or explain anything
- Combine fragments that form complete thoughts
- Keep the timestamp from where each sentence begins
- Output ONLY the formatted sentences, nothing else

INPUT TRANSCRIPT:
${chunk}

FORMAT: [MM:SS] sentence here
OUTPUT:`
}

function generateOutputPath(inputPath) {
  const dir = path.dirname(inputPath)
  const name = path.basename(inputPath, path.extname(inputPath))
  return path.join(dir, `${name}_processed.txt`)
}

// Main execution
const transcriptPath = process.argv[2]
processTranscript(transcriptPath)
