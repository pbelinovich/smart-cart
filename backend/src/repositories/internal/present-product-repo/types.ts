import { IEntity } from '../../external'

export interface IPresentProductEntity extends IEntity {
  cityId: string
  shopId: string
  createDate: string
  expiresAt: number
  queryName: string
  productName: string
  productPrice: number
  hash: string
}
