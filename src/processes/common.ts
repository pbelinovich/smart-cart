import { parentPort, workerData } from 'node:worker_threads'
import { IProcessContext, ProcessHandler } from './types'
import { getAppInstance, ProcessInitData, ProcessMessages, ProcessNames } from './external'
import { MessagesBasedCommunicator } from '@shared'

if (!parentPort) {
  throw new Error('This file should be run as a child process of server!')
}

const appInstance = getAppInstance()
export const communicator = new MessagesBasedCommunicator<ProcessNames, ProcessMessages>({
  postMessage: message => parentPort!.postMessage(message),
  onReceiveMessage: callback => {
    parentPort!.on('message', val => {
      callback(val)
    })
  },
})

export const processInitData: ProcessInitData = workerData

const { readExecutor, writeExecutor } = appInstance.getExecutors({ proxy: processInitData.proxy })

const processContext: IProcessContext = {
  readExecutor,
  writeExecutor,
  processInitData,
}

appInstance.database.subscribe(event => {
  communicator.send('dbEvent', event)
})

const processHandlerBuilder = (context: IProcessContext) => {
  return <TParams, TResult>(handler: ProcessHandler<TParams, TResult>) => {
    return (params: TParams) => handler(context, params)
  }
}

export const buildProcessHandler = processHandlerBuilder(processContext)
