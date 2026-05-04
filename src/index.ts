import {
  Client,
  GatewayIntentBits,
  Partials,
  ChatInputCommandInteraction,
} from 'discord.js'
import { config } from './config.js'
import { logger } from './utils/logger.js'
import { handleMessage } from './handlers/text.js'
import { handleInteraction } from './handlers/commands.js'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel],
})

// Bot pronto
client.once('ready', (c) => {
  logger.info(`Bot online como ${c.user.tag}`, {
    guildId: config.discord.guildId,
    textModeration: config.moderation.textEnabled,
    voiceRecording: config.recording.enabled,
  })
})

// Moderação de mensagens de texto
if (config.moderation.textEnabled) {
  client.on('messageCreate', handleMessage)
  logger.info('Moderação de texto ativada')
}

// Slash commands (para moderação de voz)
if (config.recording.enabled) {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return
    await handleInteraction(interaction as ChatInputCommandInteraction)
  })
  logger.info('Monitoramento de voz ativado')
}

// Graceful shutdown
function shutdown(signal: string): void {
  logger.info(`Sinal ${signal} recebido, encerrando...`)
  client.destroy()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', { err })
})

client.login(config.discord.token).catch((err) => {
  logger.error('Falha ao conectar ao Discord', { err })
  process.exit(1)
})
