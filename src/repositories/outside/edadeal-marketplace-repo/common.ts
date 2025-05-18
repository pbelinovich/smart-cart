import { RawAxiosRequestHeaders } from 'axios'
import { PriceCategory } from '../../types'
import { EdadealSort, IEdadealGetProductsRequestParams } from './types'

const API_VERSION = 'v4'

export const MAIN_URL = 'https://search.edadeal.io'
export const PRODUCTS_URL = `${MAIN_URL}/api/${API_VERSION}/search`

export const DEFAULT_REQUEST_HEADERS: RawAxiosRequestHeaders = {
  // Accept: 'application/json, text/plain, */*',
  Accept: 'application/json',
  'Accept-Language': 'ru',
  // 'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'Content-Type': 'application/json',
  Pragma: 'no-cache',
  Priority: 'u=1, i',
  'X-Platform': 'desktop',
}

export const PRICE_CATEGORY_TO_SORT_FIELDS_MAP: { [key in PriceCategory]?: EdadealSort } = {
  cheapest: '-priceNew',
  mostExpensive: '+priceNew',
}

export const DEFAULT_GET_PRODUCTS_PARAMS: Omit<IEdadealGetProductsRequestParams, 'text'> = {
  addContent: true,
  allNanoOffers: false,
  checkAdult: false,
  disablePlatformSourceExclusion: true,
  excludeAlcohol: false,
  groupBy: 'meta',
  limit: 140,
  offset: 0,
}
