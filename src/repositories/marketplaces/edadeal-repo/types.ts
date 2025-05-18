import { ICity } from '../../types'

export type EdadealGroupBy = 'meta' | 'sku' | 'sku_or_meta' | 'all_sku_or_meta'
export type EdadealSort =
  | '-priceNew'
  | '+priceNew'
  | '-priceCalculated'
  | '+priceCalculated'
  | '-discountPercent'
  | '+discountPercent'
  | '-dateStart'
  | '+segment'

export interface IEdadealPartner {
  uuid: string
  imageUrl: string
  name: string
  slug: string
  primaryColor: string
}

export interface IEdadealPriceValue {
  type: 'value'
  value: number
}

export interface IEdadealPriceMeta {
  currency: string
  currencyCode: string
  currencyPosition: string
}

export interface IEdadealPrice {
  value: IEdadealPriceValue
  meta: IEdadealPriceMeta
}

export interface IEdadealPriceForUnit {
  price: IEdadealPrice
  unit: string
}

export interface IEdadealProduct {
  uuid: string
  type: 'meta_offer' | 'sku'
  title: string
  partner: IEdadealPartner
  brandUuid: string
  priceForUnit: IEdadealPriceForUnit
  imageUrl: string
}

export interface IEdadealBrand {
  uuid: string
  name: string
  count: number
}

export interface IEdadealRetailer {
  uuid: string
  slug: string
  name: string
  online: boolean
  iconUrl: string
  format: string
  count: number
}

export interface IEdadealEntity {
  brands: IEdadealBrand[]
  retailers: IEdadealRetailer[]
}

export interface IEdadealGetProductsRequest {
  addContent: boolean
  allNanoOffers: boolean
  checkAdult: boolean
  disablePlatformSourceExclusion: boolean
  excludeAlcohol: boolean
  groupBy: EdadealGroupBy
  limit: number
  offset: number
  retailerUuid?: string[]
  sort?: EdadealSort
  text: string
}

export interface IEdadealGetProductsResponse {
  entities: IEdadealEntity[]
  items: IEdadealProduct[]
  searchText: string
  total: number
}

export interface IEdadealSearchRequest {
  city: ICity
  shopIds: string[]
  sort?: EdadealSort
  text: string
}
