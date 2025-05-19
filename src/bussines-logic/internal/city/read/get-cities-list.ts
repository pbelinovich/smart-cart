import { buildReadOperation } from '../../../common/read'
import { cities } from './mock'

export const getCitiesList = buildReadOperation(() => {
  return cities
}, [])
