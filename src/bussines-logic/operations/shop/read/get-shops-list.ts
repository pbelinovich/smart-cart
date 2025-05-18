import { buildReadOperation } from '../../../common/read'
import { shops } from './mock'

export const getShopsList = buildReadOperation(() => {
  return shops
}, [])
