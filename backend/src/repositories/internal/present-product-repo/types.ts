import { IEntity } from '../../external'

export interface IMarketplaceProduct {
  id: string
  name: string
  price: number
}

export interface IPresentProductEntity extends IEntity {
  cityId: string
  shopId: string
  createDate: string
  expiresAt: number
  queryName: string
  hash: string
  marketplaceProducts: IMarketplaceProduct[]
}
