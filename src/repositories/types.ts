import { EntityEvent } from './external'
import { IAIProductsListEntity, IPresentProductEntity, IProductEntity, IProductsRequestEntity, IUserEntity } from './internal'

export { EntityEvent, IEntity, DataBaseSession, IUpdatableRepo, INonUpdatableRepo } from './external'

export type AIProductsListEntityEvents = EntityEvent<IAIProductsListEntity>
export type PresentProductEntityEvents = EntityEvent<IPresentProductEntity>
export type ProductEntityEvents = EntityEvent<IProductEntity>
export type ProductsRequestEntityEvents = EntityEvent<IProductsRequestEntity>
export type UserEntityEvents = EntityEvent<IUserEntity>

export type DataBaseEvent =
  | {
      entity: 'aiProductsLists'
      event: AIProductsListEntityEvents
    }
  | {
      entity: 'presentProducts'
      event: PresentProductEntityEvents
    }
  | {
      entity: 'products'
      event: ProductEntityEvents
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

export interface IAIProduct {
  name: string
  quantity: string
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
  quantity: string
  priceCategory: PriceCategory
}

type ProductInStock = {
  kind: 'inStock'
  name: string
  quantity: string
  priceCategory: PriceCategory
  price: number
}

type ProductIsOutOfStock = {
  kind: 'isOutOfStock'
  name: string
  quantity: string
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
