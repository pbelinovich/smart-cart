import { Context } from 'telegraf'
import { logInfo, QueueMaster } from '../external'
import { SetupTelegramBotParams } from '../types'
import { CommandHandler, IDefaultCommandContext, ITgUser } from './common'

// <tg-emoji emoji-id="5397631056109117802"></tg-emoji>

export const buildCommandRunner = (botParams: SetupTelegramBotParams) => {
  const executors = botParams.app.getExecutors({})
  const queueMastersMap: Record<string, QueueMaster> = {}

  const runCommand = <TContext extends Context, TParams, TResult>(
    ctx: TContext,
    handler: CommandHandler<TParams, TResult>,
    params: TParams
  ): Promise<TResult | void> => {
    try {
      const chatId = ctx.chat?.id
      const telegramId = ctx.from?.id

      if (!chatId || !telegramId) {
        return Promise.resolve()
      }

      const tgUser: ITgUser = {
        id: telegramId,
        login: ctx.from?.username,
        firstName: ctx.from?.first_name,
        lastName: ctx.from?.last_name,
      }

      const context: IDefaultCommandContext = {
        ...executors,
        runCommand: (commandHandler, commandParams) => runCommand(ctx, commandHandler, commandParams),
        chatId,
        tgUser,
        publicHttpApi: botParams.publicHttpApi,
        sendMessage: (message: string) => {
          if (!queueMastersMap[chatId]) {
            queueMastersMap[chatId] = new QueueMaster()
          }

          return queueMastersMap[chatId].enqueue(async () => {
            await ctx.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' })
          })
        },
        log: message => {
          return logInfo(`[command${handler.name ? `/${handler.name}` : ''} | ${tgUser.login ? ` (${tgUser.login})` : ''}]: ${message}`)
        },
      }

      return handler(context, params)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      logInfo(`Error in command ${handler.name}: ${errorMessage}`)
      return Promise.resolve()
    }
  }

  return { runCommand }
}

export const buildCommand = <TParams, TResult>(handler: CommandHandler<TParams, TResult>) => {
  return (context: IDefaultCommandContext, params: TParams) => {
    context.log(JSON.stringify(params))
    return handler(context, params)
  }
}
