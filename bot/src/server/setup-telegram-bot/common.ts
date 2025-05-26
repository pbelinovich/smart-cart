import { IAppExecutors } from '../external'
import { SetupTelegramBotParams } from '../types'

export type StartCommand = 'start'
export type CityCommand = 'city'
export type CancelCommand = 'cancel'

export const START_COMMAND: StartCommand = 'start'
export const CITY_COMMAND: CityCommand = 'city'
export const CANCEL_COMMAND: CancelCommand = 'cancel'

export interface ITgUser {
  id: number
  login: string | undefined
  firstName: string | undefined
  lastName: string | undefined
}

export interface IDefaultCommandContext extends IAppExecutors {
  runCommand: CommandRunner
  publicHttpApi: SetupTelegramBotParams['publicHttpApi']
  chatId: number
  tgUser: ITgUser
  sendMessage: (message: string) => Promise<void>
  log: (message: string) => void
}

export type CommandHandler<TParams, TResult> = (context: IDefaultCommandContext, params: TParams) => Promise<TResult>
export type CommandRunner = <TParams, TResult>(handler: CommandHandler<TParams, TResult>, params: TParams) => Promise<TResult | void>
