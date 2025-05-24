import { BotCommandHandler, IBotCommandContext } from '../types'

export const buildCommandHandler = <TParams, TResult>(handler: BotCommandHandler<TParams, TResult>) => {
  return (context: IBotCommandContext, params: TParams) => {
    context.log(JSON.stringify(params))
    return handler(context, params)
  }
}
