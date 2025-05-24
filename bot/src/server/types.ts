import { publicHttpApi } from '@server'
import { ApiDomainClient, IApp } from './external'

export type ServerParams = {
  port: string
  telegramBotToken: string
  smartCartServerUrl: string
}

export type SetupAndRunServerParams = {
  serverParams: ServerParams
  app: IApp
}

export type SetupTelegramBotParams = {
  app: IApp
  telegramBotToken: string
  publicHttpApi: ApiDomainClient<typeof publicHttpApi>
}
