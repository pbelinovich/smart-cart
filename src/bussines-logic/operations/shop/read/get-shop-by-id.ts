import { buildReadOperation } from '../../../common/read'
import { shops } from './mock'

export interface IGetShopByIdParams {
  id: string
}

export const getShopById = buildReadOperation((_, params: IGetShopByIdParams) => {
  return shops.find(shop => shop.id === params.id)
}, [])
