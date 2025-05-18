import { buildReadOperation } from '../../../common/read'
import { cities } from './mock'

export const getDefaultCityId = buildReadOperation(() => {
  return cities[0] || 'msk'
}, [])
