import { Worker } from 'node:worker_threads'
import { MessagesBasedCommunicator } from '@shared'
import { DataBaseEvent, IEventBus, ProcessMessages, ProcessNames } from '../external'

export type TaskResult<TResult> = { kind: 'success'; result: TResult } | { kind: 'error'; error: any }

export type Task<TData, TResult> = {
  data: TData
  resolve: (taskResult: TaskResult<TResult>) => void
}

export type WorkerData = {
  worker: Worker
  communicator: MessagesBasedCommunicator<ProcessNames, ProcessMessages>
  proxy?: string
  busy: boolean
  destroy: () => Promise<number>
}

export type WorkerPoolParams = {
  eventBus: IEventBus<DataBaseEvent>
  size?: number
  proxyList?: string[]
  taskTimeout?: number
}
