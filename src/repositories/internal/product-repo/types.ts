import { IEntity } from '../../external'

export interface IProductEntity extends IEntity {
  productsRequestId: string
  createDate: string
  marketplaceProductHash: string
  quantity: string
}
