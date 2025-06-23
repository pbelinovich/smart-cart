import { Telegraf } from 'telegraf'
import { ISendMessageParams } from './common'

interface ISystemMessage {
  messageId: number
  params: ISendMessageParams
  timestamp: number
}

export class TelegramCommunicator {
  private lastSystemMessage: ISystemMessage | undefined

  constructor(private bot: Telegraf, private chatId: number) {}

  private addSystemMessage = (messageId: number, params: ISendMessageParams) => {
    this.lastSystemMessage = {
      messageId,
      params,
      timestamp: new Date().getTime(),
    }
  }

  clearMessageReplyMarkup = async (messageId: number) => {
    await this.bot.telegram.editMessageReplyMarkup(this.chatId, messageId, undefined, undefined)
  }

  editMessage = async (messageId: number, params: ISendMessageParams) => {
    const { message, markup, parseMode = 'HTML' } = params

    if (message) {
      await this.bot.telegram.editMessageText(this.chatId, messageId, undefined, message, { ...markup, parse_mode: parseMode })
    } else {
      await this.bot.telegram.editMessageReplyMarkup(this.chatId, messageId, undefined, markup?.reply_markup)
    }

    this.addSystemMessage(messageId, params)
  }

  sendMessage = async (params: ISendMessageParams) => {
    const { message, markup, parseMode = 'HTML' } = params

    if (!message) {
      return
    }

    const telegramMessage = await this.bot.telegram.sendMessage(this.chatId, message, {
      ...markup,
      parse_mode: parseMode,
    })

    this.addSystemMessage(telegramMessage.message_id, params)

    return telegramMessage.message_id
  }
}
