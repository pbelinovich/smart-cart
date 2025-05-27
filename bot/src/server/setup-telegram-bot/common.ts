import { IAppExecutors, IUpdateSessionParams } from '../external'
import { SetupTelegramBotParams } from '../types'
import { Markup } from 'telegraf'
import { ParseMode } from '@telegraf/types/message'

export type StartCommandName = 'start'
export type CityCommandName = 'city'
export type CancelCommandName = 'cancel'

export const START_COMMAND: StartCommandName = 'start'
export const CITY_COMMAND: CityCommandName = 'city'
export const CANCEL_COMMAND: CancelCommandName = 'cancel'

export type CommandName = StartCommandName | CityCommandName | CancelCommandName

export interface ITgUser {
  id: number
  login: string | undefined
  firstName: string | undefined
  lastName: string | undefined
}

export interface ISendMessageOptions {
  parseMode?: ParseMode
  replyMarkup?: Markup.Markup<any>
}

export interface IDefaultCommandContext extends IAppExecutors {
  publicHttpApi: SetupTelegramBotParams['publicHttpApi']
  chatId: number
  tgUser: ITgUser
  sendMessage: (message: string, options?: ISendMessageOptions) => Promise<void>
  log: (message: string) => void
  updateSession: (params: IUpdateSessionParams) => Promise<void>
}

export type CommandHandler<TParams, TResult> = (
  context: IDefaultCommandContext,
  params: TParams,
  commandRunner: ICommandRunner
) => Promise<TResult>

export type CommandRunnerHandler = <TParams, TResult>(handler: CommandHandler<TParams, TResult>, params: TParams) => Promise<TResult | void>

export interface ICommandRunner {
  runCommand: CommandRunnerHandler
}
