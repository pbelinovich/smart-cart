import { ProcessNames } from './external'
import { communicator, processInitData } from './common'
import { mistralHandlers } from './ai'
import { edadealHandlers } from './marketplaces'

const processesMap: { [key in ProcessNames]: (params: any) => any } = {
  'mistral/parseProducts': mistralHandlers.parseProducts,
  'edadeal/collectProducts': edadealHandlers.collectProducts,
}

const processesMapKeys = Object.keys(processesMap) as ProcessNames[]
const targetProcessName = processesMapKeys.find(key => processInitData.processName === key)

if (targetProcessName) {
  communicator.setRequestHandler(targetProcessName, processesMap[targetProcessName])
}
