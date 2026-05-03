import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  VoiceChannel,
  ChannelType,
} from 'discord.js'
import { startVoiceMonitoring, stopVoiceMonitoring } from './voice.js'
import { logger } from '../utils/logger.js'

// Definições dos slash commands
export const commands = [
  new SlashCommandBuilder()
    .setName('guard-join')
    .setDescription('Bot entra em um canal de voz e começa o monitoramento')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) =>
      opt
        .setName('canal')
        .setDescription('Canal de voz para monitorar')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName('guard-leave')
    .setDescription('Bot sai do canal de voz e para o monitoramento')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName('guard-status')
    .setDescription('Mostra o status atual do bot de moderação')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
].map((cmd) => cmd.toJSON())

// Handler dos slash commands
export async function handleInteraction(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: 'Comando disponível apenas em servidores.', ephemeral: true })
    return
  }

  const { commandName, guild } = interaction

  if (commandName === 'guard-join') {
    const channel = interaction.options.getChannel('canal', true) as VoiceChannel

    try {
      startVoiceMonitoring(guild, channel)
      await interaction.reply({
        content: `✅ Bot entrou em **${channel.name}** e está monitorando o áudio.`,
        ephemeral: true,
      })
    } catch (err) {
      logger.error('Erro ao entrar no canal de voz', { err })
      await interaction.reply({
        content: '❌ Não foi possível entrar no canal de voz.',
        ephemeral: true,
      })
    }
    return
  }

  if (commandName === 'guard-leave') {
    stopVoiceMonitoring(guild.id)
    await interaction.reply({
      content: '✅ Bot saiu do canal de voz.',
      ephemeral: true,
    })
    return
  }

  if (commandName === 'guard-status') {
    const { getVoiceConnection } = await import('@discordjs/voice')
    const connection = getVoiceConnection(guild.id)
    const status = connection
      ? `🟢 Monitorando voz (estado: ${connection.state.status})`
      : '🔴 Não está em nenhum canal de voz'

    await interaction.reply({ content: status, ephemeral: true })
    return
  }
}
