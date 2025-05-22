import { IEventBus, DataBaseEvent, IApp, IAppExecutors } from './external'

export type ServerParams = {
  port: string
}

export type InitProcessesParams = {
  app: IApp
  eventBus: IEventBus<DataBaseEvent>
}

export type SetupAndRunServerParams = {
  serverParams: ServerParams
  app: IApp
}

export type Job = (executors: IAppExecutors) => Promise<void>
export type JobWithUnsub = (executors: IAppExecutors) => () => void
