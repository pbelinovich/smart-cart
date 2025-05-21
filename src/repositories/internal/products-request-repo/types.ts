import { IEntity } from '../../external'

export type ProductsRequestStatus =
  | 'created'
  | 'startProductsParsing'
  | 'productsParsing'
  | 'finishProductsParsing'
  | 'startProductsCollecting'
  | 'productsCollecting'
  | 'finishProductsCollecting'

export interface IProductsRequestEntity extends IEntity {
  userId: string
  cityId: string
  createDate: string
  modifyDate?: string
  query: string
  status: ProductsRequestStatus
  error: boolean
}
