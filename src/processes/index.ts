import { parentPort } from 'node:worker_threads'
import { getAppInstance, IApp, ProcessMessages, ProcessNames } from './external'
import { MessagesBasedCommunicator } from '@shared'
import { stringToFoodList } from './string-to-food-list'

if (!parentPort) {
  throw new Error('This file should be run as a child process of server!')
}

const appInstance = getAppInstance()

const communicator = new MessagesBasedCommunicator<ProcessNames, ProcessMessages>({
  postMessage: message => parentPort!.postMessage(message),
  onReceiveMessage: callback => {
    parentPort!.on('message', val => {
      callback(val)
    })
  },
})

appInstance.database.subscribe(event => {
  communicator.send('dbEvent', event)
})

const processesMap: { [key in ProcessNames]: (appInstance: IApp) => (data: any) => any } = {
  stringToFoodList,
}

Object.keys(processesMap).forEach(key => {
  const processName = key as ProcessNames
  const handler = processesMap[processName](appInstance)

  communicator.setRequestHandler(processName, handler)
})
