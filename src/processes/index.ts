import { ProcessNames } from './external'
import { communicator, processInitData } from './common'
import { mistralHandlers } from './ai'
import { edadealHandlers } from './marketplaces'
import * as internalHandlers from './internal'

const processesMap: { [key in ProcessNames]: (params: any) => any } = {
  'mistral/parseProducts': mistralHandlers.parseProducts,
  'edadeal/collectProducts': edadealHandlers.collectProducts,
  'edadeal/searchCities': edadealHandlers.searchCities,
  'edadeal/getChercherArea': edadealHandlers.getChercherArea,
  'internal/databaseCleanup': internalHandlers.databaseCleanup,
}

processInitData.processNames.forEach(name => {
  if (processesMap[name]) {
    communicator.setRequestHandler(name, processesMap[name])
  }
})
