import { IEntity } from '../../external'

export interface ICartProductInStockHashEntity extends IEntity {
  createDate: string
  expiresAt: number
  cartId: string
  productHash: string
  marketplaceId: string
  hash: string
}
