import { REST, Routes } from 'discord.js'
import { commands } from './handlers/commands.js'
import { config } from './config.js'
import { logger } from './utils/logger.js'

const rest = new REST({ version: '10' }).setToken(config.discord.token)

async function deploy(): Promise<void> {
  logger.info('Registrando slash commands...')

  await rest.put(
    Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
    { body: commands },
  )

  logger.info(`${commands.length} comando(s) registrado(s) com sucesso.`)
}

deploy().catch((err) => {
  logger.error('Falha ao registrar comandos', { err })
  process.exit(1)
})
