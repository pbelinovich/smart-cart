import { ProcessNames } from './external'
import { communicator, processInitData } from './common'
import { mistralHandlers } from './ai'
import { edadealHandlers } from './marketplaces'

const processesMap: { [key in ProcessNames]: (params: any) => any } = {
  'mistral/parseProducts': mistralHandlers.parseProducts,
  'edadeal/collectProducts': edadealHandlers.collectProducts,
}

processInitData.processNames.forEach(name => {
  if (processesMap[name]) {
    communicator.setRequestHandler(name, processesMap[name])
  }
})
