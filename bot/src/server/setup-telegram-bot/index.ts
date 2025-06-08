import { Telegraf } from 'telegraf'
import { SetupTelegramBotParams } from '../types'
import { message } from 'telegraf/filters'
import { cancelCommand, changeCityCommand, cityCommand, selectCityCommand, startCommand, userMessageCommand } from './commands'
import { logInfo, ShutdownManager } from '../external'
import { buildCommandRunner } from './builder'
import { MessageManager } from './message-manager'
import {
  CANCEL_COMMAND,
  CHANGE_COMMAND,
  SELECT_CITY_ACTION,
  COMMANDS,
  COMMANDS_MAP,
  START_COMMAND,
  SHOW_MORE_ACTION,
  CANCEL_ACTION,
  CITY_COMMAND,
} from './common'

export const setupTelegramBot = (params: SetupTelegramBotParams) => {
  const bot = new Telegraf(params.telegramBotToken)
  const messageManager = new MessageManager()

  const { runCommand, runCommandOnce } = buildCommandRunner(params, messageManager)

  bot.command(START_COMMAND, ctx => {
    runCommandOnce(ctx, startCommand, {})
  })

  bot.command(CITY_COMMAND, ctx => {
    runCommandOnce(ctx, cityCommand, {})
  })

  bot.command(CHANGE_COMMAND, ctx => {
    runCommandOnce(ctx, changeCityCommand, {})
  })

  bot.command(CANCEL_COMMAND, ctx => {
    runCommand(ctx, cancelCommand, {})
  })

  bot.on(message('text'), ctx => {
    messageManager.handleUserMessage(ctx)
    runCommandOnce(ctx, userMessageCommand, { message: ctx.message.text.trim() })
  })

  bot.action(SHOW_MORE_ACTION, async ctx => {
    await ctx.answerCbQuery()
    messageManager.handleShowMoreAction(ctx)
  })

  bot.action(CANCEL_ACTION, async ctx => {
    await ctx.answerCbQuery()
    runCommand(ctx, cancelCommand, {})
  })

  bot.action(SELECT_CITY_ACTION, async ctx => {
    await ctx.answerCbQuery()
    const selectedCityId = ctx.match?.[1]
    if (selectedCityId) runCommandOnce(ctx, selectCityCommand, { selectedCityId })
  })

  Promise.resolve()
    .then(() => {
      return bot.telegram.setMyCommands(COMMANDS.map(command => ({ command, description: COMMANDS_MAP[command] })))
    })
    .then(() => {
      return bot.launch(() => {
        ShutdownManager.addTask(() => bot.stop('Server went down'))
        logInfo(`Telegram bot ${bot.botInfo?.username} is started`)
      })
    })
}
