import { IEntity } from '../../external'

export interface IProductEntity extends IEntity {
  productsRequestId: string
  createDate: string
  cachedProductHash: string
  quantity: string
}
