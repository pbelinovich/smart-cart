import { Telegraf } from 'telegraf'
import { SetupTelegramBotParams } from '../types'
import { message } from 'telegraf/filters'
import { cityCommand, startCommand, userMessageCommand } from './commands'
import { logInfo, ShutdownManager } from '../external'
import { buildCommandRunner } from './builder'
import { CITY_COMMAND, START_COMMAND } from './common'

export const setupTelegramBot = (params: SetupTelegramBotParams) => {
  const telegramBot = new Telegraf(params.telegramBotToken)

  const { runCommand } = buildCommandRunner(params)

  telegramBot.command(START_COMMAND, ctx => {
    return runCommand(ctx, startCommand, {})
  })

  telegramBot.command(CITY_COMMAND, ctx => {
    return runCommand(ctx, cityCommand, {})
  })

  // telegramBot.command('cancel', ctx => undefined)

  telegramBot.on(message('text'), ctx => {
    return runCommand(ctx, userMessageCommand, { message: ctx.message.text.trim() })
  })

  telegramBot.launch(() => {
    ShutdownManager.addTask(() => telegramBot.stop('Server went down'))
    logInfo(`Telegram bot ${telegramBot.botInfo?.username} is started`)
  })
}
