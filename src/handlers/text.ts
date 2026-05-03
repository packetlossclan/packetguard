import { Message, GuildMember } from 'discord.js'
import { checkBannedWords } from '../utils/words.js'
import { warnMember } from '../services/moderation.js'
import { logger } from '../utils/logger.js'

export async function handleMessage(message: Message): Promise<void> {
  // Ignora bots e mensagens fora de servidores
  if (message.author.bot || !message.guild || !message.member) return

  const result = checkBannedWords(message.content)
  if (!result.found) return

  logger.info('Mensagem com palavra proibida detectada', {
    userId: message.author.id,
    word: result.word,
    messageId: message.id,
  })

  // Deletar mensagem
  try {
    await message.delete()
  } catch {
    logger.warn('Não foi possível deletar a mensagem', { messageId: message.id })
  }

  await warnMember({
    guild: message.guild,
    member: message.member as GuildMember,
    word: result.word,
    context: message.content,
    source: 'text',
    messageId: message.id,
    channelId: message.channelId,
  })
}
