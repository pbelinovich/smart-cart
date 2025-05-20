import path from 'node:path'
import { Worker } from 'node:worker_threads'
import { lightGuid, MessagesBasedCommunicator } from '@shared'
import { DataBaseEvent, IEventBus, logInfo, ProcessInitData, ProcessMessages, ProcessNames } from '../external'
import { Task, TaskResult, WorkerData, WorkerPoolParams } from './types'

export class WorkerPool<TData, TResult> {
  private readonly eventBus: IEventBus<DataBaseEvent>
  private readonly taskName: ProcessNames
  private readonly taskTimeout: number

  private queue: Task<TData, TResult>[] = []
  private workers: { [workerId: string]: WorkerData } = {}

  constructor({ taskName, eventBus, size = 1, proxyList = [], taskTimeout = 30000 }: WorkerPoolParams) {
    this.eventBus = eventBus
    this.taskName = taskName
    this.taskTimeout = taskTimeout

    for (let i = 0; i < size; i++) {
      this.createWorkerInstance(proxyList[i])
    }
  }

  private log = (workerId: string, message: string) => {
    logInfo(`[${this.taskName} | ${workerId}] ${message}`)
  }

  private createWorkerInstance = (proxy?: string) => {
    const workerId = lightGuid()
    const processInitData: ProcessInitData = { processId: workerId, processName: this.taskName, proxy }

    const worker = new Worker(path.join(__dirname, '../processes/index.js'), { workerData: processInitData })
    const communicator = new MessagesBasedCommunicator<ProcessNames, ProcessMessages>({
      postMessage: message => worker.postMessage(message),
      onReceiveMessage: callback => {
        worker.on('message', val => {
          callback(val)
        })
      },
    })

    const unsubFromDb = communicator.on('dbEvent', event => {
      this.eventBus.sendEvent(event)
    })

    this.workers[workerId] = {
      worker,
      communicator,
      proxy,
      busy: false,
      destroy: () => {
        unsubFromDb()
        return worker.terminate()
      },
    }

    this.log(workerId, 'Process has started')

    return workerId
  }

  private tryNext = () => {
    if (!this.queue.length) {
      return
    }

    const freeWorkerId = Object.keys(this.workers).find(workerId => !this.workers[workerId].busy)

    if (!freeWorkerId) {
      return
    }

    const [task, ...restTasks] = this.queue

    this.workers[freeWorkerId].busy = true
    this.queue = restTasks

    let destroyed = false
    const timeoutId = setTimeout(async () => {
      task.resolve({ kind: 'error', error: new Error(`Task timeout of process ${freeWorkerId}`) })
      destroyed = true

      if (this.workers[freeWorkerId]) {
        this.log(freeWorkerId, 'Process has timed out')
        await this.workers[freeWorkerId].destroy()
        const sock5h = this.workers[freeWorkerId].proxy
        delete this.workers[freeWorkerId]
        this.createWorkerInstance(sock5h)
      }
    }, this.taskTimeout)

    const resolve = (taskResult: TaskResult<TResult>) => {
      if (destroyed) return
      clearTimeout(timeoutId)
      this.workers[freeWorkerId].busy = false
      task.resolve(taskResult)
      this.tryNext()
    }

    this.workers[freeWorkerId].communicator
      .request<TResult>(this.taskName, task.data)
      .then(result => resolve({ kind: 'success', result }))
      .catch(error => resolve({ kind: 'error', error }))
  }

  runTask = (data: TData) => {
    let promiseResolve: (result: TaskResult<TResult>) => void = () => undefined

    this.queue.push({ data, resolve: result => promiseResolve(result) })
    this.tryNext()

    return new Promise<TaskResult<TResult>>(resolve => {
      promiseResolve = result => resolve(result)
    })
  }
}
