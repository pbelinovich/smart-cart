import { IAuthEntity, IUserAddressEntity } from '../../internal'

export type IIgooodsSort = 'popularity' | 'price'
export type IIgooodsSortOrder = 'asc' | 'desc'

export interface IIgooodsGetPageResponse<T> {
  data: {
    list: T[]
    total: number
  }
}

export interface IIgooodsGetShopsParams {
  auth: IAuthEntity
  userAddress: IUserAddressEntity
}

export interface IIgooodsGetProductParams {
  auth: IAuthEntity
  shopId: string
  query: string
  sort: IIgooodsSort
  sortOrder: IIgooodsSortOrder
}

export interface IIgooodsProduct {
  name: string
  price: number
}

export interface IIgooodsGetShopsRequestParams {
  lng: number
  lat: number
  branding_support: boolean
}

export interface IIgooodsGetProductsRequestParams {
  limit: number
  sort: IIgooodsSort
  sort_order: IIgooodsSortOrder
  pharmacy_support: boolean
  query: string
}
