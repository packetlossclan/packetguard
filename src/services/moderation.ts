import {
  Guild,
  GuildMember,
  TextChannel,
  EmbedBuilder,
  Colors,
} from 'discord.js'
import { config } from '../config.js'
import { logger } from '../utils/logger.js'

export type ModerationSource = 'text' | 'voice'

export interface WarnOptions {
  guild: Guild
  member: GuildMember
  word: string
  context: string // mensagem ou transcrição
  source: ModerationSource
  messageId?: string
  channelId?: string
}

// Envia aviso no DM do usuário
async function sendDmWarning(member: GuildMember, word: string, source: ModerationSource): Promise<void> {
  const sourceLabel = source === 'text' ? 'mensagem de texto' : 'mensagem de voz'
  try {
    await member.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Yellow)
          .setTitle('⚠️ Aviso de moderação')
          .setDescription(
            `Você foi advertido por usar linguagem inapropriada em uma ${sourceLabel} no servidor **${member.guild.name}**.`,
          )
          .addFields({ name: 'Palavra/frase detectada', value: `\`${word}\`` })
          .setTimestamp(),
      ],
    })
  } catch {
    logger.warn('Não foi possível enviar DM para o usuário', { userId: member.id })
  }
}

// Envia log no canal de moderação
async function sendLogEmbed(options: WarnOptions): Promise<void> {
  const { guild, member, word, context, source, channelId } = options

  const logChannel = guild.channels.cache.get(config.discord.logChannelId) as TextChannel | undefined
  if (!logChannel) {
    logger.warn('Canal de log não encontrado', { logChannelId: config.discord.logChannelId })
    return
  }

  const sourceLabel = source === 'text' ? '💬 Texto' : '🎙️ Voz (transcrição)'
  const embed = new EmbedBuilder()
    .setColor(Colors.Red)
    .setTitle('🚨 Palavra proibida detectada')
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: 'Usuário', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
      { name: 'Fonte', value: sourceLabel, inline: true },
      { name: 'Palavra detectada', value: `\`${word}\`` },
      { name: 'Contexto', value: `\`\`\`${context.slice(0, 500)}\`\`\`` },
    )
    .setTimestamp()

  if (channelId) {
    embed.addFields({ name: 'Canal', value: `<#${channelId}>`, inline: true })
  }

  await logChannel.send({ embeds: [embed] })
}

// Ação principal de moderação
export async function warnMember(options: WarnOptions): Promise<void> {
  const { member, word, source } = options

  logger.warn('Palavra proibida detectada', {
    userId: member.id,
    userTag: member.user.tag,
    word,
    source,
  })

  await Promise.allSettled([
    sendDmWarning(member, word, source),
    sendLogEmbed(options),
  ])
}
