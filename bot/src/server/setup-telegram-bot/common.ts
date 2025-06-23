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
  message?: string
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

export const SELECT_CITY_ACTION_LABEL = 'se'
export const SHOW_CART_ACTION_LABEL = 'sh'
export const SWAP_PRODUCT_ACTION_LABEL = 'sw'
export const SWAP_PRESENT_PRODUCT_ACTION_LABEL = 'swp'
export const SWAP_ABSENT_PRODUCT_ACTION_LABEL = 'swa'
export const CHOOSE_PRESENT_PRODUCT_ACTION_LABEL = 'chp'

const ENTITY_ID = '[0-9a-zA-Z/\\-]+'
const HASH = '[0-9a-zA-Z+/]+={0,2}'
const INDEX = '[0-9]+'

export const SELECT_CITY_ACTION = new RegExp(`^${SELECT_CITY_ACTION_LABEL}\\|(${ENTITY_ID})$`, 'i')
export const SHOW_CART_ACTION = new RegExp(`^${SHOW_CART_ACTION_LABEL}\\|(${ENTITY_ID})$`, 'i')
export const SWAP_PRODUCT_ACTION = new RegExp(`^${SWAP_PRODUCT_ACTION_LABEL}\\|(${ENTITY_ID})$`, 'i')
export const SWAP_PRESENT_PRODUCT_ACTION = new RegExp(
  `^${SWAP_PRESENT_PRODUCT_ACTION_LABEL}\\|(${ENTITY_ID})\\|(${INDEX})\\|(${INDEX})$`,
  'i'
)
export const SWAP_ABSENT_PRODUCT_ACTION = new RegExp(`^${SWAP_ABSENT_PRODUCT_ACTION_LABEL}\\|(${ENTITY_ID})\\|(${INDEX})$`, 'i')
export const CHOOSE_PRESENT_PRODUCT_ACTION = new RegExp(`^${CHOOSE_PRESENT_PRODUCT_ACTION_LABEL}\\|(${HASH})$`, 'i')

export const getSelectCityAction = (cityId: string) => {
  return `${SELECT_CITY_ACTION_LABEL}|${cityId}`
}

export const getShowCartAction = (cartId: string) => {
  return `${SHOW_CART_ACTION_LABEL}|${cartId}`
}

export const getSwapProductAction = (cartId: string) => {
  return `${SWAP_PRODUCT_ACTION_LABEL}|${cartId}`
}

export const getSwapPresentProductAction = (cartId: string, cartProductInStockIndex: number, presentProductIndex: number) => {
  return `${SWAP_PRESENT_PRODUCT_ACTION_LABEL}|${cartId}|${cartProductInStockIndex}|${presentProductIndex}`
}

export const getSwapAbsentProductAction = (cartId: string, index: number) => {
  return `${SWAP_ABSENT_PRODUCT_ACTION_LABEL}|${cartId}|${index}`
}

export const getChoosePresentProductAction = (hash: string) => {
  return `${CHOOSE_PRESENT_PRODUCT_ACTION_LABEL}|${hash}`
}
