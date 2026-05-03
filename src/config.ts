import 'dotenv/config'
import path from 'path'

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Variável de ambiente obrigatória não definida: ${key}`)
  return value
}

export const config = {
  discord: {
    token: requireEnv('DISCORD_TOKEN'),
    clientId: requireEnv('DISCORD_CLIENT_ID'),
    guildId: requireEnv('DISCORD_GUILD_ID'),
    logChannelId: requireEnv('LOG_CHANNEL_ID'),
  },
  groq: {
    apiKey: requireEnv('GROQ_API_KEY'),
  },
  recording: {
    dir: path.resolve(process.env.RECORDINGS_DIR ?? './recordings'),
    silenceDuration: Number(process.env.SILENCE_DURATION ?? 1500),
    enabled: process.env.VOICE_RECORDING_ENABLED !== 'false',
  },
  moderation: {
    textEnabled: process.env.TEXT_MODERATION_ENABLED !== 'false',
  },
} as const
