import { ICoordinates } from '../../types'

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

export type EdadealPriceValue =
  | {
      type: 'value'
      value: number
    }
  | {
      type: 'range'
      from: number
      to: number
    }

export interface IEdadealPriceMeta {
  currency: string
  currencyCode: string
  currencyPosition: string
}

export interface IEdadealPrice {
  value: EdadealPriceValue
  meta: IEdadealPriceMeta
}

export interface IEdadealPriceForUnit {
  price: IEdadealPrice
  unit: string
}

export interface IEdadealPriceDataMeta {
  currency: string
  currencyCode: string
  currencyPosition: string
}

export interface IEdadealPriceData {
  meta: IEdadealPriceMeta
  new: EdadealPriceValue
}

export interface IEdadealProduct {
  uuid: string
  type: 'meta_offer' | 'sku'
  title: string
  partner: IEdadealPartner
  brandUuid: string
  priceData?: IEdadealPriceData
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

export interface IEdadealExternalProductsSearchRequest {
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

export interface IEdadealProductsSearchResponse {
  entities: IEdadealEntity[]
  items: IEdadealProduct[]
  searchText: string
  total: number
}

export interface IEdadealProductsSearchRequest {
  coordinates: ICoordinates
  chercherArea: string
  shopIds: string[]
  sort?: EdadealSort
  text: string
}

export interface IEdadealExternalCitiesSearchRequest {
  country_geo_id: string
  lang: string
  q: string
}

export interface IEdadealCitiesSearchRequest {
  query: string
}

export interface IEdadealCitiesSearchResponseItem {
  uuid: string
  center: { lat: number; lng: number }
  fullName: string
  name: string
  region: string
  slug: string
  lvl: number
}

export type EdadealCitiesSearchResponse = IEdadealCitiesSearchResponseItem[]

export interface IEdadealGetChercherRequest {
  coordinates: ICoordinates
}

export interface IEdadealGetChercherResponse {
  chercherArea: string
}
