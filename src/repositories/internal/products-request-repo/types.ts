import { IEntity } from '../../external'
import { IAIProduct, ICart } from '../../types'

export type ProductsRequestStatus = 'created' | 'productsParsing' | 'productsParsed' | 'productsCollecting' | 'productsCollected'

export interface IProductsRequestEntity extends IEntity {
  userId: string
  cityId: string
  createDate: string
  modifyDate?: string
  query: string
  status: ProductsRequestStatus
  error: boolean
  aiProducts: IAIProduct[]
  carts: ICart[]
}
