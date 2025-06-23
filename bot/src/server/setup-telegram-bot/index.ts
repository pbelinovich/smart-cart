import { Telegraf } from 'telegraf'
import { SetupTelegramBotParams } from '../types'
import { message } from 'telegraf/filters'
import { logInfo, ShutdownManager } from '../external'
import { buildCommandRunner } from './builder'
import {
  cancelCommand,
  changeCityCommand,
  cityCommand,
  swapProductCommand,
  showCartCommand,
  selectCityCommand,
  startCommand,
  userMessageCommand,
  swapPresentProductCommand,
  choosePresentProductCommand,
} from './commands'
import {
  CANCEL_COMMAND,
  CHANGE_COMMAND,
  SELECT_CITY_ACTION,
  COMMANDS,
  COMMANDS_MAP,
  START_COMMAND,
  CANCEL_ACTION,
  CITY_COMMAND,
  SWAP_PRODUCT_ACTION,
  SHOW_CART_ACTION,
  SWAP_PRESENT_PRODUCT_ACTION,
  SWAP_ABSENT_PRODUCT_ACTION,
  CHOOSE_PRESENT_PRODUCT_ACTION,
} from './common'

export const setupTelegramBot = (params: SetupTelegramBotParams) => {
  const bot = new Telegraf(params.telegramBotToken)
  const { runCommand, runCommandOnce } = buildCommandRunner(params, bot)

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
    // messageManager.handleUserMessage(ctx)
    runCommandOnce(ctx, userMessageCommand, { message: ctx.message.text.trim() })
  })

  bot.action(SHOW_CART_ACTION, async ctx => {
    const messageId = ctx.callbackQuery?.message?.message_id
    const cartId = ctx.match?.[1]

    if (messageId && cartId) {
      await runCommandOnce(ctx, showCartCommand, { messageId, cartId })
    }

    await ctx.answerCbQuery()
  })

  bot.action(SWAP_PRODUCT_ACTION, async ctx => {
    const messageId = ctx.callbackQuery?.message?.message_id
    const cartId = ctx.match?.[1]

    if (messageId && cartId) {
      await runCommandOnce(ctx, swapProductCommand, { messageId, cartId })
    }

    await ctx.answerCbQuery()
  })

  bot.action(SWAP_PRESENT_PRODUCT_ACTION, async ctx => {
    const messageId = ctx.callbackQuery?.message?.message_id
    const cartId = ctx.match?.[1]
    const cartProductInStockIndex = parseInt(ctx.match?.[2])
    const marketplaceProductIndex = parseInt(ctx.match?.[3])

    if (messageId && cartId && cartProductInStockIndex !== undefined && marketplaceProductIndex !== undefined) {
      await runCommandOnce(ctx, swapPresentProductCommand, { messageId, cartId, cartProductInStockIndex, marketplaceProductIndex })
    }

    await ctx.answerCbQuery()
  })

  bot.action(SWAP_ABSENT_PRODUCT_ACTION, async ctx => {
    const messageId = ctx.callbackQuery?.message?.message_id
    const cartId = ctx.match?.[1]
    const index = parseInt(ctx.match?.[2])

    if (messageId && cartId && index !== undefined) {
      // runCommandOnce(ctx, swapAbsentProductCommand, { messageId, cartId, index })
    }

    await ctx.answerCbQuery()
  })

  bot.action(CHOOSE_PRESENT_PRODUCT_ACTION, async ctx => {
    const messageId = ctx.callbackQuery?.message?.message_id
    const hash = ctx.match?.[1]

    if (messageId && hash) {
      await runCommandOnce(ctx, choosePresentProductCommand, { messageId, hash })
    }

    await ctx.answerCbQuery()
  })

  bot.action(CANCEL_ACTION, async ctx => {
    await runCommand(ctx, cancelCommand, {})
    await ctx.answerCbQuery()
  })

  bot.action(SELECT_CITY_ACTION, async ctx => {
    const selectedCityId = ctx.match?.[1]

    if (selectedCityId) {
      await runCommandOnce(ctx, selectCityCommand, { selectedCityId })
    }

    await ctx.answerCbQuery()
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
