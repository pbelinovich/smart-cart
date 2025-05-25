import { IAppExecutors } from '../external'
import { SetupTelegramBotParams } from '../types'

export type UserCommand = 'start' | 'city' | 'userMessage' | 'cancel'

export interface IBotCommandContext extends IAppExecutors {
  chatId: number
  telegramId: number
  publicHttpApi: SetupTelegramBotParams['publicHttpApi']
  sendMessage: (message: string) => Promise<void>
  log: (message: string) => void
}

export type BotCommandHandler<TParams, TResult> = (context: IBotCommandContext, params: TParams) => Promise<TResult>
