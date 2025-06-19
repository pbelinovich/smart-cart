import { IAppExecutors, QueueMaster } from '../external'
import { SetupTelegramBotParams } from '../types'
import { Markup } from 'telegraf'
import { InlineKeyboardMarkup } from '@telegraf/types'
import { ParseMode } from '@telegraf/types/message'
import { SubscriptionManager } from './subscription-manager'
import { TelegramCommunicator } from './telegram-communicator'

export type StartCommandName = 'start'
export type CityCommandName = 'city'
export type ChangeCityCommandName = 'change'
export type CancelCommandName = 'cancel'

export type CommandName = StartCommandName | CityCommandName | ChangeCityCommandName | CancelCommandName

export type CancelActionName = 'cancel'
export type ActionName = CancelActionName

export interface ITgUser {
  id: number
  login: string | undefined
  firstName: string | undefined
  lastName: string | undefined
}

export interface ISendMessageParams {
  message: string
  parseMode?: ParseMode
  markup?: Markup.Markup<InlineKeyboardMarkup>
}

export interface IDefaultCommandContext extends IAppExecutors {
  publicHttpApi: SetupTelegramBotParams['publicHttpApi']
  chatId: number
  tgUser: ITgUser
  subscriptionManager: SubscriptionManager
  telegram: TelegramCommunicator
  queueMaster: QueueMaster
  log: (message: string) => void
}

export type CommandHandler<TParams, TResult> = (
  context: IDefaultCommandContext,
  params: TParams,
  commandRunner: ICommandRunner
) => Promise<TResult> | TResult

export type BuildCommandHandler<TCommand extends string, TParams, TResult> = {
  name: TCommand
  handler: CommandHandler<TParams, TResult>
  errorHandler?: CommandHandler<TParams, void>
}

export type CommandRunnerHandler = <TCommand extends string, TParams, TResult>(
  handler: BuildCommandHandler<TCommand, TParams, TResult>,
  params: TParams
) => Promise<TResult | void>

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

export const CANCEL_ACTION: CancelActionName = 'cancel'

export const SELECT_CITY_ACTION_LABEL = 'sc'
export const SWAP_PRODUCT_ACTION_LABEL = 'sp'

export const SELECT_CITY_ACTION = new RegExp(`^${SELECT_CITY_ACTION_LABEL}\\|([a-f0-9/\\-]+)$`, 'i')
export const SWAP_PRODUCT_ACTION = new RegExp(`^${SWAP_PRODUCT_ACTION_LABEL}\\|([0-9a-zA-Z/\\-]+)\\|([0-9]+)$`, 'i')

export const getSelectCityAction = (cityId: string) => {
  return `${SELECT_CITY_ACTION_LABEL}|${cityId}`
}

export const getSwapProductAction = (productsRequestId: string, offset: number) => {
  return `${SWAP_PRODUCT_ACTION_LABEL}|${productsRequestId}|${offset}`
}
