import { Context } from 'telegraf'
import { logInfo } from '../external'
import { SetupTelegramBotParams } from '../types'
import { CommandHandler, ICommandRunner, IDefaultCommandContext, ITgUser } from './common'
import { MessageManager } from './message-manager'

// <tg-emoji emoji-id="5397631056109117802"></tg-emoji>

export const buildCommandRunner = ({ app, publicHttpApi }: SetupTelegramBotParams, messageManager: MessageManager) => {
  const executors = app.getExecutors({})
  const runners = new Map<
    number,
    (
      | { kind: 'doing'; command: string }
      | {
          kind: 'delayed'
          command: string
          timeoutId?: any
        }
    )[]
  >()

  const run = <TContext extends Context, TParams, TResult>(
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
        runCommand: (commandHandler, commandParams) => run(ctx, commandHandler, commandParams),
      }

      return handler(context, params, commandRunner)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      logInfo(`Error in command ${handler.name}: ${errorMessage}`)
      return Promise.resolve()
    }
  }

  const runCommand = async <TContext extends Context, TParams, TResult>(
    ctx: TContext,
    handler: CommandHandler<TParams, TResult>,
    params: TParams
  ) => {
    const chatId = ctx.chat?.id

    if (!chatId) {
      return
    }

    const runner = runners.get(chatId) || []

    runners.set(chatId, [...runner, { command: handler.name, kind: 'doing' }])

    await run(ctx, handler, params)
    runners.delete(chatId)
  }

  const runCommandOnce = async <TContext extends Context, TParams, TResult>(
    ctx: TContext,
    handler: CommandHandler<TParams, TResult>,
    params: TParams
  ) => {
    const chatId = ctx.chat?.id

    if (!chatId) {
      return
    }

    const runner = runners.get(chatId) || []

    if (runner.some(x => x.kind === 'doing' || x.kind === 'delayed')) {
      return
    }

    await runCommand(ctx, handler, params)
  }

  return {
    runCommand,
    runCommandOnce,
    runCommandDelayed: <TContext extends Context, TParams, TResult>(
      ctx: TContext,
      handler: CommandHandler<TParams, TResult>,
      params: TParams
    ) => {
      const chatId = ctx.chat?.id

      if (!chatId) {
        return
      }

      const runner = runners.get(chatId) || []

      runner.forEach(x => {
        if (x.command === handler.name && x.kind === 'delayed') {
          clearTimeout(x.timeoutId)
        }
      })

      const timeoutId = setTimeout(() => runCommandOnce(ctx, handler, params), 400)
      runners.set(chatId, [...runner, { kind: 'delayed', command: handler.name, timeoutId }])
    },
  }
}

export const buildCommand = <TCommand extends string, TParams, TResult>(command: TCommand, handler: CommandHandler<TParams, TResult>) => {
  const currentHandler = (context: IDefaultCommandContext, params: TParams, commandRunner: ICommandRunner) => {
    context.log(JSON.stringify(params))
    return handler(context, params, commandRunner)
  }

  Object.defineProperty(currentHandler, 'name', {
    value: command,
    writable: true,
  })

  return currentHandler
}
