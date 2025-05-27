import { Context } from 'telegraf'
import { createSession, getSessionByTelegramId, logInfo, QueueMaster, updateSession } from '../external'
import { SetupTelegramBotParams } from '../types'
import { CommandHandler, ICommandRunner, IDefaultCommandContext, ITgUser } from './common'

// <tg-emoji emoji-id="5397631056109117802"></tg-emoji>

export const buildCommandRunner = (botParams: SetupTelegramBotParams) => {
  const executors = botParams.app.getExecutors({})
  const queueMastersMap: Record<string, QueueMaster> = {}
  const runnersMap: Record<string, { kind: 'doing' } | { kind: 'delayed'; timeoutId: any }> = {}

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
        chatId,
        tgUser,
        publicHttpApi: botParams.publicHttpApi,
        sendMessage: (message, { parseMode = 'HTML', replyMarkup } = {}) => {
          if (!queueMastersMap[chatId]) {
            queueMastersMap[chatId] = new QueueMaster()
          }

          return queueMastersMap[chatId].enqueue(async () => {
            await ctx.telegram.sendMessage(chatId, message, { ...replyMarkup, parse_mode: parseMode })
          })
        },
        log: message => {
          return logInfo(`[command${handler.name ? `/${handler.name}` : ''} | ${tgUser.login ? ` (${tgUser.login})` : ''}]: ${message}`)
        },
        updateSession: async params => {
          const session = await executors.readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

          if (session) {
            await executors.writeExecutor.execute(updateSession, params)
          } else {
            let user = await botParams.publicHttpApi.user.GET.byTelegramId({ telegramId: tgUser.id })

            if (!user) {
              user = await botParams.publicHttpApi.user.POST.create({
                telegramId: tgUser.id,
                telegramLogin: tgUser.login,
                telegramFirstName: tgUser.firstName,
                telegramLastName: tgUser.lastName,
              })
            }

            await executors.writeExecutor.execute(createSession, {
              ...params,
              userId: user.id,
              telegramId: tgUser.id,
            })
          }
        },
      }

      const commandRunner: ICommandRunner = {
        runCommand: (commandHandler, commandParams) => runCommand(ctx, commandHandler, commandParams),
      }

      return handler(context, params, commandRunner)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      logInfo(`Error in command ${handler.name}: ${errorMessage}`)
      return Promise.resolve()
    }
  }

  return {
    runCommand: <TContext extends Context, TParams, TResult>(ctx: TContext, handler: CommandHandler<TParams, TResult>, params: TParams) => {
      try {
        const chatId = ctx.chat?.id
        const telegramId = ctx.from?.id

        if (!chatId || !telegramId) {
          return
        }

        const runner = runnersMap[chatId]

        if (!runner || runner.kind === 'delayed') {
          if (runner?.kind === 'delayed') {
            clearTimeout(runner.timeoutId)
          }

          const timeoutId = setTimeout(async () => {
            runnersMap[chatId] = { kind: 'doing' }
            await runCommand(ctx, handler, params)
            delete runnersMap[chatId]
          }, 1000)

          runnersMap[chatId] = { kind: 'delayed', timeoutId }
          return
        }
      } catch (e) {}
    },
  }
}

export const buildCommand = <TParams, TResult>(handler: CommandHandler<TParams, TResult>) => {
  return (context: IDefaultCommandContext, params: TParams, commandRunner: ICommandRunner) => {
    context.log(JSON.stringify(params))
    return handler(context, params, commandRunner)
  }
}
