import { Context, Telegraf } from 'telegraf'
import { SetupTelegramBotParams } from '../types'
import { message } from 'telegraf/filters'
import { IBotCommandContext, UserCommand } from './types'
import { startCommand, userMessageCommand } from './commands'
import { logInfo, QueueMaster, ShutdownManager } from '../external'

const MAX_MSG_LENGTH = 300

export const setupTelegramBot = ({ app, telegramBotToken, publicHttpApi }: SetupTelegramBotParams) => {
  const bot = new Telegraf(telegramBotToken)
  const executors = app.getExecutors({})

  const queueMaster = new QueueMaster()

  const getChatId = (ctx: Context) => ctx.chat?.id
  const getTelegramId = (ctx: Context) => ctx.from?.id

  const getContext = (chatId: number, telegramId: number, command: UserCommand, ctx: Context): IBotCommandContext => ({
    ...executors,
    chatId,
    telegramId,
    publicHttpApi,
    sendMessage: message => {
      return queueMaster.enqueue(async () => {
        // <tg-emoji emoji-id="5397631056109117802"></tg-emoji>
        await ctx.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' })
      })
    },
    log: message => logInfo(`command/${command}: ${message}`),
  })

  bot.start(ctx => {
    const chatId = getChatId(ctx)
    const telegramId = getTelegramId(ctx)

    if (!chatId || !telegramId) {
      return
    }

    return startCommand(getContext(chatId, telegramId, 'start', ctx), {})
  })

  bot.command('city', ctx => {
    const chatId = getChatId(ctx)
    const telegramId = getTelegramId(ctx)

    if (!chatId || !telegramId) {
      return
    }
  })

  bot.command('cancel', ctx => {
    const chatId = getChatId(ctx)
    const telegramId = getTelegramId(ctx)

    if (!chatId || !telegramId) {
      return
    }
  })

  bot.on(message('text'), ctx => {
    const chatId = getChatId(ctx)
    const telegramId = getTelegramId(ctx)

    if (!chatId || !telegramId) {
      return
    }

    const message = ctx.message.text.trim()

    if (message.length > MAX_MSG_LENGTH) {
      ctx.reply('Слишком длинное сообщение\\. Пожалуйста\\, сократите до 300 символов\\.', { parse_mode: 'MarkdownV2' })
      return
    }

    return userMessageCommand(getContext(chatId, telegramId, 'userMessage', ctx), { message })
  })

  Promise.resolve().then(() => {
    return bot.launch(() => {
      ShutdownManager.addTask(() => bot.stop('Server went down'))
      logInfo(`Telegram bot ${bot.botInfo?.username} is started`)
    })
  })
}
