import { getAppInstance } from './external'
import { setupAndRunServer } from './server-setup'
import { ServerParams } from './types'
import { DataBaseEvent, EventBus } from './external'
import { initProcesses } from './init-processes'

export const initMainThread = (serverParams: ServerParams) => {
  const appInstance = getAppInstance()
  const eventBus = new EventBus<DataBaseEvent>()

  appInstance.database.subscribe(eventBus.sendEvent)
  appInstance.memoryStorage.subscribe(eventBus.sendEvent)

  setupAndRunServer({ serverParams, app: appInstance })
  initProcesses({ eventBus })
}
