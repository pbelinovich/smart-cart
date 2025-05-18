import { EntityEvent } from './external'
import { MessagesBasedCommunicator } from '@shared'
import { IUserEntity } from './internal'

export { EntityEvent, IEntity, DataBaseSession, IUpdatableRepo, INonUpdatableRepo } from './external'

export type UserEntityEvents = EntityEvent<IUserEntity>

export type DataBaseEvent = {
  entity: 'users'
  event: UserEntityEvents
}

export type ProcessNames = 'parseProducts'
export type ProcessMessages = 'dbEvent'
export type ProcessCommunicator = MessagesBasedCommunicator<ProcessNames, ProcessMessages>

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

export type Marketplace = 'igooods' | 'edadeal'

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

export interface IProduct {
  name: string
  quantity: number
  price: number
}

export interface ICart {
  shopId: string
  shopName: string
  products: IProduct[]
  totalPrice: number
}

export type CartsMap = { [shopId: string]: ICart }

export interface IGetCartsParams {
  // auth: IAuthEntity
  // userAddress?: IUserAddressEntity
  userProducts: IAIProduct[]
}

export interface IMarketplace<T> {
  // getAuthData: () => Promise<AuthData | undefined>
  // getCities: () => Promise<ICity[]>
  getCarts: (params: IGetCartsParams) => Promise<{ carts: ICart[]; responses: T[] }>
}

export interface IMarketplaceRepo<TSearchParams, TSearchResult> {
  search: (params: TSearchParams) => Promise<TSearchResult>
}

export interface IFetchEdadealProductsParams {
  productsRequestId: string
  product: IAIProduct
}
