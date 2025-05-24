import { createApiClient, getAppInstance } from './external'
import { setupAndRunServer } from './server-setup'
import { ServerParams } from './types'
import { DataBaseEvent, EventBus } from './external'
import { setupTelegramBot } from './setup-telegram-bot'
import { publicHttpApi } from '@server'

export const initMainThread = (serverParams: ServerParams) => {
  const appInstance = getAppInstance()
  const eventBus = new EventBus<DataBaseEvent>()

  appInstance.memoryStorage.subscribe(eventBus.sendEvent)

  setupAndRunServer({ serverParams, app: appInstance })

  setupTelegramBot({
    app: appInstance,
    telegramBotToken: serverParams.telegramBotToken,
    publicHttpApi: createApiClient<typeof publicHttpApi>(serverParams.smartCartServerUrl, 'public'),
  })
}
