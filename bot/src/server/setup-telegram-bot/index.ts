import { Context, Telegraf } from 'telegraf'
import { SetupTelegramBotParams } from '../types'
import { message } from 'telegraf/filters'
import { IBotCommandContext, UserCommand } from './types'
import { startCommand, userMessageCommand } from './commands'
import { logInfo, ShutdownManager } from '../external'
import { escapeMarkdownV2 } from './tools'

const MAX_MSG_LENGTH = 300

export const setupTelegramBot = ({ app, telegramBotToken, publicHttpApi }: SetupTelegramBotParams) => {
  const bot = new Telegraf(telegramBotToken)
  const executors = app.getExecutors({})

  const getTelegramId = (ctx: Context) => ctx.from?.id
  const getContext = (telegramId: number, command: UserCommand, ctx: Context): IBotCommandContext => ({
    ...executors,
    telegramId,
    publicHttpApi,
    reply: async message => {
      await ctx.reply(escapeMarkdownV2(message), { parse_mode: 'MarkdownV2' })
    },
    log: message => logInfo(`command/${command}: ${message}`),
  })

  bot.start(ctx => {
    const telegramId = getTelegramId(ctx)

    if (!telegramId) {
      return
    }

    return startCommand(getContext(telegramId, 'start', ctx), {})
  })

  bot.command('city', ctx => {
    const telegramId = getTelegramId(ctx)

    if (!telegramId) {
      return
    }
  })

  bot.command('cancel', ctx => {
    const telegramId = getTelegramId(ctx)

    if (!telegramId) {
      return
    }
  })

  bot.on(message('text'), ctx => {
    const telegramId = getTelegramId(ctx)

    if (!telegramId) {
      return
    }

    const message = ctx.message.text.trim()

    if (message.length > MAX_MSG_LENGTH) {
      ctx.reply('Слишком длинное сообщение\\. Пожалуйста\\, сократите до 300 символов\\.', { parse_mode: 'MarkdownV2' })
      return
    }

    return userMessageCommand(getContext(telegramId, 'userMessage', ctx), { message })
  })

  Promise.resolve().then(() => {
    return bot.launch(() => {
      ShutdownManager.addTask(() => bot.stop('Server went down'))
      logInfo(`Telegram bot ${bot.botInfo?.username} is started`)
    })
  })
}
