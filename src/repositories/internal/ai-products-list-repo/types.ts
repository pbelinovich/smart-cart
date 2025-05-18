import { IEntity } from '../../external'
import { IAIProduct } from '../../types'

export interface IAIProductsListEntity extends IEntity {
  productsRequestId: string
  createDate: string
  list: IAIProduct[]
}
