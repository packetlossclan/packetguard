import fs from 'fs'
import path from 'path'
import {
  VoiceConnection,
  EndBehaviorType,
  getVoiceConnection,
  joinVoiceChannel,
} from '@discordjs/voice'
import * as prism from 'prism-media'
import { Guild, VoiceChannel, GuildMember } from 'discord.js'
import { config } from '../config.js'
import { logger } from '../utils/logger.js'
import { pcmToWav, transcribeAudio, cleanupFiles } from '../services/transcription.js'
import { checkBannedWords } from '../utils/words.js'
import { warnMember } from '../services/moderation.js'

// Garante que o diretório de gravações existe
if (!fs.existsSync(config.recording.dir)) {
  fs.mkdirSync(config.recording.dir, { recursive: true })
}

// Faz o bot entrar no canal e começar a monitorar
export function startVoiceMonitoring(guild: Guild, channel: VoiceChannel): VoiceConnection {
  const existing = getVoiceConnection(guild.id)
  if (existing) existing.destroy()

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false, // DEVE ser false para ouvir os outros
    selfMute: true,  // Bot não vai falar
  })

  const receiver = connection.receiver

  receiver.speaking.on('start', (userId) => {
    const member = guild.members.cache.get(userId)
    if (!member || member.user.bot) return

    logger.info('Usuário começou a falar', { userId, tag: member.user.tag })

    const audioStream = receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.AfterSilence,
        duration: config.recording.silenceDuration,
      },
    })

    const pcmPath = path.join(
      config.recording.dir,
      `${userId}-${Date.now()}.pcm`,
    )

    const decoder = new prism.opus.Decoder({
      rate: 48000,
      channels: 2,
      frameSize: 960,
    })

    const out = fs.createWriteStream(pcmPath)
    audioStream.pipe(decoder).pipe(out)

    audioStream.once('end', () => {
      out.end()
      out.once('finish', () => {
        processRecording(pcmPath, member, channel.id)
      })
    })
  })

  logger.info('Monitoramento de voz iniciado', {
    guildId: guild.id,
    channelId: channel.id,
    channelName: channel.name,
  })

  return connection
}

// Processa a gravação: converte, transcreve e modera
async function processRecording(
  pcmPath: string,
  member: GuildMember,
  channelId: string,
): Promise<void> {
  let wavPath: string | null = null

  try {
    wavPath = await pcmToWav(pcmPath)
    const transcription = await transcribeAudio(wavPath)

    if (!transcription) return

    logger.info('Transcrição recebida', {
      userId: member.id,
      text: transcription.slice(0, 100),
    })

    const result = checkBannedWords(transcription)
    if (!result.found) return

    await warnMember({
      guild: member.guild,
      member,
      word: result.word,
      context: transcription,
      source: 'voice',
      channelId,
    })
  } catch (err) {
    logger.error('Erro ao processar gravação', { pcmPath, err })
  } finally {
    cleanupFiles(pcmPath, ...(wavPath ? [wavPath] : []))
  }
}

// Para o monitoramento de voz no servidor
export function stopVoiceMonitoring(guildId: string): void {
  const connection = getVoiceConnection(guildId)
  if (connection) {
    connection.destroy()
    logger.info('Monitoramento de voz encerrado', { guildId })
  }
}
