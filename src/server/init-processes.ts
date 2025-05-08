import path from 'node:path'
import { Worker } from 'node:worker_threads'
import { logInfo, ProcessMessages, ProcessNames } from './external'
import { MessagesBasedCommunicator } from '@shared'
import { InitProcessesParams } from './types'

export const initProcesses = ({ eventBus }: InitProcessesParams) => {
  const worker = new Worker(path.join(__dirname, '../processes/index.js'))
  const communicator = new MessagesBasedCommunicator<ProcessNames, ProcessMessages>({
    postMessage: message => worker.postMessage(message),
    onReceiveMessage: callback => {
      worker.on('message', val => {
        callback(val)
      })
    },
  })

  communicator.on('dbEvent', event => {
    eventBus.sendEvent(event)
  })

  logInfo(`String to food list process has started!`)

  return communicator
}
