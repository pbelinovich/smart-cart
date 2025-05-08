import { IEventBus, DataBaseEvent, IApp, ProcessCommunicator } from './external'

export type ServerParams = {
  port: string
}

export type InitProcessesParams = {
  eventBus: IEventBus<DataBaseEvent>
}

export type SetupAndRunServerParams = {
  serverParams: ServerParams
  app: IApp
  process: ProcessCommunicator
}
