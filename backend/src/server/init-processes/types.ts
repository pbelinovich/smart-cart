import { Worker } from 'node:worker_threads'
import { MessagesBasedCommunicator } from '@shared'
import { DataBaseEvent, IEventBus, ProcessMessages, ProcessNames } from '../external'

export type TaskResult<TResult> =
  | {
      kind: 'success'
      result: TResult
    }
  | {
      kind: 'error'
      error: any
    }
  | {
      kind: 'stoppedByPreTask'
    }

export type PreTaskParams = {
  stopTask: () => void
}

export type TaskExtra = {
  preTask?: (params: PreTaskParams) => Promise<void>
}

export type Task<TProcess extends ProcessNames, TData, TResult> = {
  name: TProcess
  data: TData
  extra?: TaskExtra
  resolve: (taskResult: TaskResult<TResult>) => void
}

export type WorkerData = {
  worker: Worker
  communicator: MessagesBasedCommunicator<ProcessNames, ProcessMessages>
  proxy?: string
  busy: boolean
  destroy: () => Promise<number>
}

export type WorkerPoolParams<TProcess extends ProcessNames> = {
  taskNames: TProcess[]
  eventBus: IEventBus<DataBaseEvent>
  size?: number
  proxyList?: string[]
  taskTimeout?: number
}
