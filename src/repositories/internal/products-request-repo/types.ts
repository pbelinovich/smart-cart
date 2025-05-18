import { IEntity } from '../../external'

export type ProductsRequestStatus = 'created' | 'executed' | 'error'

export interface IProductsRequestEntity extends IEntity {
  userId: string
  cityId: string
  createDate: string
  query: string
  status: ProductsRequestStatus
}
