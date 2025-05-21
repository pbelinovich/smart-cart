import { IEntity } from '../../external'

export interface IProductsResponseEntity extends IEntity {
  productsRequestId: string
  createDate: string
  data: any
}
