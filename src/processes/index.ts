import { parseProducts } from './parse-products'
import { fetchEdadealProducts } from './fetch-edadeal-products'
import { finishFetchEdadealProducts } from './finish-fetch-edadeal-products'
import { ProcessNames } from './external'
import { communicator, processInitData } from './common'

const processesMap: { [key in ProcessNames]: (params: any) => any } = {
  parseProducts,
  fetchEdadealProducts,
  finishFetchEdadealProducts,
}

const processesMapKeys = Object.keys(processesMap) as ProcessNames[]
const targetProcessName = processesMapKeys.find(key => processInitData.processName === key)

if (targetProcessName) {
  communicator.setRequestHandler(targetProcessName, processesMap[targetProcessName])
}
