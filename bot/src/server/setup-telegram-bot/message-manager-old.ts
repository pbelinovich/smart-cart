/* import { Context, Markup } from 'telegraf'
import { ISendMessageOptions, SHOW_MORE_ACTION } from './common'
import { QueueMaster } from '../external'

export type MessageInfo = {
  message: string
  options?: ISendMessageOptions
}

const ROWS_LIMIT = 2000

export class MessageManager {
  private messageQueues = new Map<number, MessageInfo[]>()
  private queueMasters = new Map<number, QueueMaster>()

  // chatId -> messageId -> { hasMarkup: boolean; timestamp: number }
  private systemMessagesInfos = new Map<number, Array<{ messageId: number; hasMarkup: boolean; timestamp: number }>>()
  // chatId -> { messageId: number; timestamp: number }
  private lastUserMessagesInfos = new Map<number, { messageId: number; timestamp: number }>()

  private addSystemMessage = (chatId: number, messageId: number, hasMarkup: boolean) => {
    const systemMessagesInfos = (this.systemMessagesInfos.get(chatId) || []).filter(x => x.messageId !== messageId)

    let nextSystemMessagesInfos = systemMessagesInfos.concat({
      messageId,
      hasMarkup,
      timestamp: new Date().getTime(),
    })

    if (nextSystemMessagesInfos.length > ROWS_LIMIT) {
      nextSystemMessagesInfos = nextSystemMessagesInfos.slice(1, ROWS_LIMIT)
    }

    this.systemMessagesInfos.set(chatId, nextSystemMessagesInfos)
  }

  private sendMessage = (
    ctx: Context,
    message: string,
    { messageId, parseMode = 'HTML', markup }: ISendMessageOptions = {}
  ): Promise<number | undefined> => {
    return new Promise(resolve => {
      const chatId = ctx.chat?.id

      if (!chatId) {
        return resolve(undefined)
      }

      if (!this.queueMasters.has(chatId)) {
        this.queueMasters.set(chatId, new QueueMaster())
      }

      this.queueMasters.get(chatId)!.enqueue(async () => {
        const systemMessagesInfos = this.systemMessagesInfos.get(chatId) || []
        const lastUserMessageInfo = this.lastUserMessagesInfos.get(chatId)

        let lastSystemMessageInfo: { messageId: number; hasMarkup: boolean; timestamp: number } | undefined

        if (systemMessagesInfos.length) {
          lastSystemMessageInfo = systemMessagesInfos[systemMessagesInfos.length - 1]
        }

        if (lastSystemMessageInfo?.hasMarkup) {
          try {
            await ctx.telegram.editMessageReplyMarkup(chatId, messageId, undefined, undefined)
          } catch (e) {}
        }

        if (
          messageId &&
          lastSystemMessageInfo &&
          (!lastUserMessageInfo || lastSystemMessageInfo.timestamp > lastUserMessageInfo.timestamp)
        ) {
          try {
            await ctx.telegram.editMessageText(chatId, lastSystemMessageInfo.messageId, undefined, message, {
              ...markup,
              parse_mode: parseMode,
            })

            this.addSystemMessage(chatId, lastSystemMessageInfo.messageId, Boolean(markup))

            return resolve(lastSystemMessageInfo.messageId)
          } catch (e) {}
        }

        const mess = await ctx.telegram.sendMessage(chatId, message, {
          ...markup,
          parse_mode: parseMode,
        })

        this.addSystemMessage(chatId, mess.message_id, Boolean(markup))

        return resolve(mess.message_id)
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

    this.lastUserMessagesInfos.set(chatId, { messageId, timestamp: new Date().getTime() })
  }

  handleShowMoreAction = (ctx: Context) => {
    this.sendBatchMessage(ctx)
  }

  send = (ctx: Context, message: string, options?: ISendMessageOptions) => {
    return this.sendMessage(ctx, message, options)
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
} */
