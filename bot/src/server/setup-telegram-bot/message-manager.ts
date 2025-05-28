import { Context, Markup } from 'telegraf'
import { ISendMessageOptions, SHOW_MORE_ACTION } from './common'
import { QueueMaster } from '../external'

export type MessageInfo = {
  message: string
  options?: ISendMessageOptions
}

export class MessageManager {
  private messageQueues = new Map<number, MessageInfo[]>()
  private queueMasters = new Map<number, QueueMaster>()
  private lastMessageInfos = new Map<number, { messageId: number; hasMarkup: boolean; timestamp: number }>()
  private lastUserMessageInfos = new Map<number, { messageId: number; timestamp: number }>()

  private sendMessage = (ctx: Context, message: string, { kind = 'default', parseMode = 'HTML', markup }: ISendMessageOptions = {}) => {
    const chatId = ctx.chat?.id

    if (!chatId) {
      return
    }

    if (!this.queueMasters.has(chatId)) {
      this.queueMasters.set(chatId, new QueueMaster())
    }

    this.queueMasters.get(chatId)!.enqueue(async () => {
      const lastMessageInfo = this.lastMessageInfos.get(chatId)
      const lastUserMessageInfo = this.lastUserMessageInfos.get(chatId)

      if (lastMessageInfo?.hasMarkup) {
        try {
          await ctx.telegram.editMessageReplyMarkup(chatId, lastMessageInfo.messageId, undefined, undefined)
        } catch (e) {}
      }

      if (kind === 'edit' && lastMessageInfo && (!lastUserMessageInfo || lastMessageInfo.timestamp > lastUserMessageInfo.timestamp)) {
        try {
          await ctx.telegram.editMessageText(chatId, lastMessageInfo.messageId, undefined, message, {
            ...markup,
            parse_mode: parseMode,
          })

          this.lastMessageInfos.set(chatId, {
            messageId: lastMessageInfo.messageId,
            hasMarkup: Boolean(markup),
            timestamp: new Date().getTime(),
          })

          return
        } catch (e) {}
      }

      const mess = await ctx.telegram.sendMessage(chatId, message, {
        ...markup,
        parse_mode: parseMode,
      })

      this.lastMessageInfos.set(chatId, {
        messageId: mess.message_id,
        hasMarkup: Boolean(markup),
        timestamp: new Date().getTime(),
      })
    })
  }

  private sendBatchMessage = (ctx: Context) => {
    const chatId = ctx.chat?.id

    if (!chatId) {
      return
    }

    const messagesQueue = this.messageQueues.get(chatId)

    if (!messagesQueue || !messagesQueue.length) {
      return
    }

    const [messagePart, ...restMessageParts] = messagesQueue
    this.messageQueues.set(chatId, restMessageParts)

    let options = messagePart.options

    if (restMessageParts.length) {
      options = {
        ...options,
        markup: Markup.inlineKeyboard([[Markup.button.callback('Показать ещё', SHOW_MORE_ACTION)]]),
      }
    }

    this.sendMessage(ctx, messagePart.message, options)
  }

  handleUserMessage = (ctx: Context) => {
    const chatId = ctx.chat?.id
    const messageId = ctx.message?.message_id

    if (!chatId || !messageId) {
      return
    }

    this.lastUserMessageInfos.set(chatId, { messageId, timestamp: new Date().getTime() })
  }

  handleShowMoreAction = (ctx: Context) => {
    this.sendBatchMessage(ctx)
  }

  send = (ctx: Context, message: string, options?: ISendMessageOptions) => {
    this.sendMessage(ctx, message, options)
  }

  sendBatch = (ctx: Context, messagesInfos: MessageInfo[]) => {
    if (!messagesInfos.length) {
      return
    }

    const chatId = ctx.chat?.id

    if (!chatId) {
      return
    }

    this.messageQueues.set(chatId, messagesInfos)
    this.sendBatchMessage(ctx)
  }
}
