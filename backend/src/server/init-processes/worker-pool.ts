import path from 'node:path'
import { Worker } from 'node:worker_threads'
import { lightGuid, MessagesBasedCommunicator } from '@shared'
import { DataBaseEvent, IEventBus, logInfo, ProcessInitData, ProcessMessages, ProcessNames } from '../external'
import { Task, TaskExtra, TaskResult, WorkerData, WorkerPoolParams } from './types'

export class WorkerPool<TProcess extends ProcessNames> {
  private readonly eventBus: IEventBus<DataBaseEvent>
  private readonly taskNames: TProcess[]
  private readonly taskTimeout: number

  private queue: Task<TProcess, any, any>[] = []
  private workers: { [workerId: string]: WorkerData } = {}

  constructor({ taskNames, eventBus, size = 1, proxyList = [], taskTimeout = 30000 }: WorkerPoolParams<TProcess>) {
    this.eventBus = eventBus
    this.taskNames = taskNames
    this.taskTimeout = taskTimeout

    for (let i = 0; i < size; i++) {
      this.createWorkerInstance(proxyList[i])
    }
  }

  private log = (workerId: string, message: string) => {
    logInfo(`[${this.taskNames.join(' | ')} | "${workerId}"] ${message}`)
  }

  private createWorkerInstance = (proxy?: string) => {
    const workerId = lightGuid()
    const processInitData: ProcessInitData = { processId: workerId, processNames: this.taskNames, proxy }

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

    const resolve = (taskResult: TaskResult<any>) => {
      if (destroyed) return
      clearTimeout(timeoutId)
      this.workers[freeWorkerId].busy = false
      task.resolve(taskResult)
      this.tryNext()
    }

    let stoppedByPreTask = false

    Promise.resolve()
      .then(() => (task.extra?.preTask ? task.extra.preTask({ stopTask: () => (stoppedByPreTask = true) }) : undefined))
      .then(() => (!stoppedByPreTask ? this.workers[freeWorkerId].communicator.request<any>(task.name, task.data) : undefined))
      .then(result => resolve(stoppedByPreTask ? { kind: 'stoppedByPreTask' } : { kind: 'success', result }))
      .catch(error => resolve({ kind: 'error', error }))
  }

  runTask = <TData, TResult>(name: TProcess, data: TData, extra?: TaskExtra) => {
    let promiseResolve: (result: TaskResult<TResult>) => void = () => undefined

    this.queue.push({ name, data, extra, resolve: result => promiseResolve(result) })
    this.tryNext()

    return new Promise<TaskResult<TResult>>(resolve => {
      promiseResolve = result => resolve(result)
    })
  }
}
