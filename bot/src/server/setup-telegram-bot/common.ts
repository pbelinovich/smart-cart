import { IAppExecutors } from '../external'
import { SetupTelegramBotParams } from '../types'
import { Markup } from 'telegraf'
import { ParseMode } from '@telegraf/types/message'
import { MessageInfo } from './message-manager'

export type StartCommandName = 'start'
export type CityCommandName = 'city'
export type ChangeCityCommandName = 'change'
export type CancelCommandName = 'cancel'

export type CommandName = StartCommandName | CityCommandName | ChangeCityCommandName | CancelCommandName

export type ShowMoreActionName = 'showMore'
export type CancelActionName = 'cancel'
export type ActionName = ShowMoreActionName | CancelActionName

export interface ITgUser {
  id: number
  login: string | undefined
  firstName: string | undefined
  lastName: string | undefined
}

export interface ISendMessageOptions {
  kind?: 'default' | 'edit'
  parseMode?: ParseMode
  markup?: Markup.Markup<any>
}

export interface IDefaultCommandContext extends IAppExecutors {
  publicHttpApi: SetupTelegramBotParams['publicHttpApi']
  chatId: number
  tgUser: ITgUser
  send: (message: string, options?: ISendMessageOptions) => void
  sendBatch: (messagesInfos: MessageInfo[]) => void
  log: (message: string) => void
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

export const START_COMMAND: StartCommandName = 'start'
export const CITY_COMMAND: CityCommandName = 'city'
export const CHANGE_COMMAND: ChangeCityCommandName = 'change'
export const CANCEL_COMMAND: CancelCommandName = 'cancel'

export const COMMANDS_MAP: { [key in CommandName]: string } = {
  [START_COMMAND]: 'Начать работу с ботом',
  [CITY_COMMAND]: 'Узнать текущий город',
  [CHANGE_COMMAND]: 'Сменить город',
  [CANCEL_COMMAND]: 'Отменить действие',
}

export const COMMANDS = Object.keys(COMMANDS_MAP) as CommandName[]

export const SHOW_MORE_ACTION: ShowMoreActionName = 'showMore'
export const CANCEL_ACTION: CancelActionName = 'cancel'
export const SELECT_CITY_ACTION = /^selectCity\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/
