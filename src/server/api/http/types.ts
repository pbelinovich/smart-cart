import { IApp, IAppExecutors, IAppMarketplaces, ProcessCommunicator } from '../../external'
import { Express } from 'express'

export type PublicHandlersContext = {
  process: ProcessCommunicator
  readExecutor: IAppExecutors['readExecutor']
  writeExecutor: IAppExecutors['writeExecutor']
  external: IAppMarketplaces
}

export type SetupHttpApiParams = {
  expressApp: Express
  app: IApp
  process: ProcessCommunicator
}
