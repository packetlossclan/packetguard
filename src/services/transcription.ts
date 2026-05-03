import fs from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import Groq from 'groq-sdk'
import { config } from '../config.js'
import { logger } from '../utils/logger.js'

const execAsync = promisify(exec)
const groq = new Groq({ apiKey: config.groq.apiKey })

// Converte PCM bruto (saída do Discord) para WAV usando ffmpeg
export async function pcmToWav(pcmPath: string): Promise<string> {
  const wavPath = pcmPath.replace('.pcm', '.wav')
  await execAsync(
    `ffmpeg -y -f s16le -ar 48000 -ac 2 -i "${pcmPath}" "${wavPath}"`,
  )
  return wavPath
}

// Transcreve um arquivo de áudio WAV usando Whisper via Groq
export async function transcribeAudio(wavPath: string): Promise<string | null> {
  try {
    const stat = fs.statSync(wavPath)

    // Ignora arquivos muito pequenos (silêncio ou ruído)
    if (stat.size < 8000) {
      logger.debug('Arquivo de áudio muito pequeno, ignorando', { wavPath })
      return null
    }

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(wavPath),
      model: 'whisper-large-v3',
      language: 'pt',
      response_format: 'text',
    })

    return typeof transcription === 'string' ? transcription : null
  } catch (err) {
    logger.error('Erro ao transcrever áudio', { wavPath, err })
    return null
  }
}

// Remove arquivos temporários de gravação
export function cleanupFiles(...paths: string[]): void {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p)
    } catch {
      // ignora erros de limpeza
    }
  }
}
