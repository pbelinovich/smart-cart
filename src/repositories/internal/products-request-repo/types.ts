import { IEntity } from '../../external'

export type ProductsRequestStatus =
  | 'created'
  | 'aiParsing'
  | 'errorWhileAIParsing'
  | 'aiParsed'
  | 'collecting'
  | 'errorWhileCollecting'
  | 'collected'

export interface IProductsRequestEntity extends IEntity {
  userId: string
  cityId: string
  createDate: string
  query: string
  status: ProductsRequestStatus
}
