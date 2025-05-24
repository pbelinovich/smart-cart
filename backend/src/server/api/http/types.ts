import { DataBaseEvent, IApp, IAppExecutors, IEventBus } from '../../external'
import { Express } from 'express'

export type PublicHandlersContext = {
  readExecutor: IAppExecutors['readExecutor']
  writeExecutor: IAppExecutors['writeExecutor']
}

export type SetupHttpApiParams = {
  expressApp: Express
  app: IApp
  eventBus: IEventBus<DataBaseEvent>
}
