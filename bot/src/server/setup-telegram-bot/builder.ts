import { Context } from 'telegraf'
import { getSessionByTelegramId, logInfo, updateSession } from '../external'
import { SetupTelegramBotParams } from '../types'
import { BuildCommandHandler, ICommandRunner, IDefaultCommandContext, ITgUser } from './common'
import { MessageManager } from './message-manager'
import { SubscriptionManager } from './subscription-manager'

// <tg-emoji emoji-id="5397631056109117802"></tg-emoji>

export const buildCommandRunner = ({ app, publicHttpApi }: SetupTelegramBotParams, messageManager: MessageManager) => {
  const executors = app.getExecutors({})
  const subscriptionManager = new SubscriptionManager()
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

  const run = async <TContext extends Context, TCommand extends string, TParams, TResult>(
    ctx: TContext,
    handler: BuildCommandHandler<TCommand, TParams, TResult>,
    params: TParams
  ): Promise<TResult | void> => {
    const chatId = ctx.chat?.id
    const telegramId = ctx.from?.id

    if (!chatId || !telegramId) {
      return
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
      subscriptionManager,
      publicHttpApi,
      send: (message, options) => messageManager.send(ctx, message, options),
      sendBatch: messagesInfos => messageManager.sendBatch(ctx, messagesInfos),
      log: message => {
        return logInfo(`[${handler.name} | ${tgUser.id}${tgUser.login ? ` (${tgUser.login})` : ''}]: ${message}`)
      },
    }

    const commandRunner: ICommandRunner = {
      runCommand: (commandHandler, commandParams) => run(ctx, commandHandler, commandParams),
    }

    try {
      let logMessage = 'run'

      if (typeof params === 'object' && params !== null && Object.keys(params).length > 0) {
        logMessage += ` -> ${JSON.stringify(params)}`
      }

      context.log(logMessage)

      return handler.handler(context, params, commandRunner)
    } catch (e) {
      subscriptionManager.cleanup(chatId)

      const [session] = await Promise.all([
        executors.readExecutor.execute(getSessionByTelegramId, { telegramId }),
        handler.errorHandler ? handler.errorHandler(context, params, commandRunner) : undefined,
      ])

      context.log(`err -> ${e instanceof Error ? e.message : String(e)}`)

      if (session && session.state !== 'idle') {
        await executors.writeExecutor.execute(updateSession, { id: session.id, state: 'idle' })
      }
    }
  }

  const runCommand = async <TContext extends Context, TCommand extends string, TParams, TResult>(
    ctx: TContext,
    handler: BuildCommandHandler<TCommand, TParams, TResult>,
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

  const runCommandOnce = async <TContext extends Context, TCommand extends string, TParams, TResult>(
    ctx: TContext,
    handler: BuildCommandHandler<TCommand, TParams, TResult>,
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
    runCommandDelayed: <TContext extends Context, TCommand extends string, TParams, TResult>(
      ctx: TContext,
      handler: BuildCommandHandler<TCommand, TParams, TResult>,
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

export const buildCommand = <TCommand extends string, TParams, TResult>(handler: BuildCommandHandler<TCommand, TParams, TResult>) => {
  return handler
}
