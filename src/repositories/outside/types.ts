import { IUserProduct } from '../types'
import { IUserAddressEntity } from '../inside'

export interface ICity {
  id: string
  name: string
}

export interface IShop {
  id: string
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
  userAddress?: IUserAddressEntity
  userProducts: IUserProduct[]
}

export interface IMarketplace {
  // getAuthData: () => Promise<AuthData | undefined>
  // getCities: () => Promise<ICity[]>
  getCarts: (params: IGetCartsParams) => Promise<ICart[]>
}
