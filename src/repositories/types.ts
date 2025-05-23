import { EntityEvent } from './external'
import {
  IAbsentProductEntity,
  IChangeCityRequestEntity,
  ICityEntity,
  IPresentProductEntity,
  IProductsRequestEntity,
  IUserEntity,
} from './internal'

export { EntityEvent, IEntity, DataBaseSession, IUpdatableRepo, INonUpdatableRepo } from './external'

export type AbsentProductEntityEvents = EntityEvent<IAbsentProductEntity>
export type ChangeCityRequestEntityEvents = EntityEvent<IChangeCityRequestEntity>
export type CityEntityEvents = EntityEvent<ICityEntity>
export type PresentProductEntityEvents = EntityEvent<IPresentProductEntity>
export type ProductsRequestEntityEvents = EntityEvent<IProductsRequestEntity>
export type UserEntityEvents = EntityEvent<IUserEntity>

export type DataBaseEvent =
  | {
      entity: 'absentProducts'
      event: AbsentProductEntityEvents
    }
  | {
      entity: 'changeCityRequests'
      event: ChangeCityRequestEntityEvents
    }
  | {
      entity: 'cities'
      event: CityEntityEvents
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
export type EdadealSearchCities = 'edadeal/searchCities'
export type EdadealGetChercherArea = 'edadeal/getChercherArea'
export type InternalDatabaseCleanup = 'internal/databaseCleanup'

export type ProcessNames =
  | MistralParseProducts
  | EdadealCollectProducts
  | EdadealSearchCities
  | EdadealGetChercherArea
  | InternalDatabaseCleanup

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
  region: string
  slug: string
  lvl: number
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
  name: string
  quantity: number
  priceCategory: PriceCategory
  price: number
}

type ProductIsOutOfStock = {
  name: string
  quantity: number
  priceCategory: PriceCategory
}

export interface ICart {
  shopId: string
  shopName: string
  productsInStock: ProductInStock[]
  productsAreOutOfStock: ProductIsOutOfStock[]
  totalPrice: number
}

export interface IMarketplaceRepo<TSearchParams, TSearchResult> {
  searchProducts: (params: TSearchParams) => Promise<TSearchResult>
}

export interface IParseProductsParams {
  productsRequestId: string
}

export interface ICollectProductsParams {
  productsRequestId: string
  product: IAIProduct
}

export interface ISearchCitiesParams {
  changeCityRequestId: string
  query: string
}

export interface IGetChercherAreaParams {
  changeCityRequestId: string
}

export interface IDatabaseCleanupParams {
  cronExpression: string
}
