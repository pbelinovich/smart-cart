import { IEventBus, DataBaseEvent, IApp } from './external'

export type ServerParams = {
  port: string
}

export type InitProcessesParams = {
  eventBus: IEventBus<DataBaseEvent>
}

export type SetupAndRunServerParams = {
  serverParams: ServerParams
  app: IApp
}
