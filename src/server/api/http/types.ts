import { IApp, IAppExecutors } from '../../external'
import { Express } from 'express'

export type PublicHandlersContext = {
  readExecutor: IAppExecutors['readExecutor']
  writeExecutor: IAppExecutors['writeExecutor']
}

export type SetupHttpApiParams = {
  expressApp: Express
  app: IApp
}
