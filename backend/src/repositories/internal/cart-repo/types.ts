import { IEntity, ProductIsOutOfStock, ProductInStock } from '../../types'

export interface ICartEntity extends IEntity {
  productsRequestId: string
  createDate: string
  modifyDate?: string
  shopId: string
  shopName: string
  productsInStock: { data: ProductInStock[]; total: number }
  productsAreOutOfStock: { data: ProductIsOutOfStock[]; total: number }
  totalPrice: number
}
