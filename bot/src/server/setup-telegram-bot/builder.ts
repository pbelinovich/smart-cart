import { Context } from 'telegraf'
import { logInfo } from '../external'
import { SetupTelegramBotParams } from '../types'
import { CommandHandler, ICommandRunner, IDefaultCommandContext, ITgUser } from './common'
import { MessageManager } from './message-manager'

// <tg-emoji emoji-id="5397631056109117802"></tg-emoji>

export const buildCommandRunner = ({ app, publicHttpApi }: SetupTelegramBotParams, messageManager: MessageManager) => {
  const executors = app.getExecutors({})
  const runners = new Map<number, { kind: 'doing' } | { kind: 'delayed'; timeoutId: any }>()

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
        publicHttpApi,
        send: (message, options) => messageManager.send(ctx, message, options),
        sendBatch: messagesInfos => messageManager.sendBatch(ctx, messagesInfos),
        log: message => {
          return logInfo(`[command${handler.name ? `/${handler.name}` : ''} | ${tgUser.login ? ` (${tgUser.login})` : ''}]: ${message}`)
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

        if (!chatId) {
          return
        }

        const runner = runners.get(chatId)

        if (runner) {
          if (runner.kind === 'doing') {
            return
          }

          if (runner.kind === 'delayed') {
            clearTimeout(runner.timeoutId)
          }
        }

        const timeoutId = setTimeout(async () => {
          runners.set(chatId, { kind: 'doing' })
          await runCommand(ctx, handler, params)
          runners.delete(chatId)
        }, 400)

        runners.set(chatId, { kind: 'delayed', timeoutId })
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
