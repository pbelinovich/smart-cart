/* import { ISendMessageOptions, ISendMessageParams } from './common'
import { TelegramCommunicator } from './telegram-communicator'

interface ISystemMessage {
  messageId: number
  params: ISendMessageParams
  timestamp: number
}

const ROWS_LIMIT = 2000

export class MessageManager {
  private systemMessages: ISystemMessage[] = []

  constructor(private telegram: TelegramCommunicator) {}

  private addSystemMessage = (messageId: number, params: ISendMessageParams) => {
    const systemMessages = this.systemMessages.filter(x => x.messageId !== messageId)

    let nextSystemMessages = systemMessages.concat({
      messageId,
      params,
      timestamp: new Date().getTime(),
    })

    if (nextSystemMessages.length > ROWS_LIMIT) {
      nextSystemMessages = nextSystemMessages.slice(1, ROWS_LIMIT)
    }

    this.systemMessages = nextSystemMessages
  }

  clearMessageReplyMarkup = (messageId: number) => {
    if (!this.telegram) {
      throw new Error('Looks like you forgot to set ctx')
    }

    return this.telegram.clearMessageReplyMarkup(messageId)
  }

  sendMessage = async (message: string, options?: ISendMessageOptions) => {
    if (!this.telegram) {
      throw new Error('Looks like you forgot to set ctx')
    }

    const params: ISendMessageParams = { message, options }
    const telegramMessage = await this.telegram.sendMessage(params)

    this.addSystemMessage(telegramMessage.message_id, params)

    return telegramMessage.message_id
  }

  editMessage = async (messageId: number, message: string, options?: ISendMessageOptions) => {
    if (!this.telegram) {
      throw new Error('Looks like you forgot to set ctx')
    }

    const params: ISendMessageParams = { message, options }

    await this.telegram.editMessage(messageId, params)
    this.addSystemMessage(messageId, params)

    return messageId
  }
} */
