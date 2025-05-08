import { getAppInstance } from './external'
import { setupAndRunServer } from './server-setup'
import { ServerParams } from './types'
import { DataBaseEvent, EventBus } from './external'

export const initMainThread = (params: ServerParams) => {
  const appInstance = getAppInstance()
  const eventBus = new EventBus<DataBaseEvent>()

  appInstance.database.subscribe(eventBus.sendEvent)
  appInstance.memoryStorage.subscribe(eventBus.sendEvent)

  setupAndRunServer(params, appInstance)
}
