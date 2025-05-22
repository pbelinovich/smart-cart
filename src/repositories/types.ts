import { EntityEvent } from './external'
import { IAbsentProductEntity, IPresentProductEntity, IProductsRequestEntity, IUserEntity } from './internal'

export { EntityEvent, IEntity, DataBaseSession, IUpdatableRepo, INonUpdatableRepo } from './external'

export type AbsentProductEntityEvents = EntityEvent<IAbsentProductEntity>
export type PresentProductEntityEvents = EntityEvent<IPresentProductEntity>
export type ProductsRequestEntityEvents = EntityEvent<IProductsRequestEntity>
export type UserEntityEvents = EntityEvent<IUserEntity>

export type DataBaseEvent =
  | {
      entity: 'absentProducts'
      event: AbsentProductEntityEvents
    }
  | {
      entity: 'presentProducts'
      event: PresentProductEntityEvents
    }
  | {
      entity: 'productsRequests'
      event: ProductsRequestEntityEvents
    }
  | {
      entity: 'users'
      event: UserEntityEvents
    }

export type MistralParseProducts = 'mistral/parseProducts'
export type EdadealCollectProducts = 'edadeal/collectProducts'

export type ProcessNames = MistralParseProducts | EdadealCollectProducts
export type ProcessMessages = 'dbEvent'
export type ProcessInitData = { processId: string; processNames: ProcessNames[]; proxy?: string }

export type PriceCategory = 'cheapest' | 'popular' | 'mostExpensive'

export interface IRawAIProduct {
  name: string
  quantity: string
  priceCategory: PriceCategory
}

export interface IAIProduct {
  name: string
  quantity: number
  priceCategory: PriceCategory
}

export interface ICoordinates {
  latitude: number
  longitude: number
}

export interface ICity {
  id: string
  name: string
  coordinates: ICoordinates
}

export interface IShop {
  id: string
  marketplaceId: string
  name: string
}

export interface ICollectedProduct {
  cachedProductHash: string
  quantity: number
  priceCategory: PriceCategory
}

type ProductInStock = {
  kind: 'inStock'
  name: string
  quantity: number
  priceCategory: PriceCategory
  price: number
}

type ProductIsOutOfStock = {
  kind: 'isOutOfStock'
  name: string
  quantity: number
  priceCategory: PriceCategory
}

export type Product = ProductInStock | ProductIsOutOfStock

export interface ICart {
  shopId: string
  shopName: string
  products: Product[]
  totalPrice: number
}

export interface IMarketplaceRepo<TSearchParams, TSearchResult> {
  search: (params: TSearchParams) => Promise<TSearchResult>
}

export interface IParseProductsParams {
  productsRequestId: string
}

export interface ICollectProductsParams {
  productsRequestId: string
  product: IAIProduct
}
