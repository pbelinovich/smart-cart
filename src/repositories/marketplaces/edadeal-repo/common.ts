import { PriceCategory } from '../../types'
import { EdadealSort, IEdadealGetProductsRequest } from './types'
import { OutgoingHttpHeaders } from 'node:http'

const API_VERSION = 'v4'

export const MAIN_URL = 'https://search.edadeal.io'
export const SEARCH_URL = `${MAIN_URL}/api/${API_VERSION}/search`

export const DEFAULT_REQUEST_HEADERS: OutgoingHttpHeaders = {
  'X-Platform': 'desktop',
}

export const PRICE_CATEGORY_TO_SORT_FIELDS_MAP: { [key in PriceCategory]?: EdadealSort } = {
  cheapest: '-priceNew',
  mostExpensive: '+priceNew',
}

export const DEFAULT_GET_PRODUCTS_PARAMS: Omit<IEdadealGetProductsRequest, 'text' | 'limit'> = {
  addContent: true,
  allNanoOffers: false,
  checkAdult: false,
  disablePlatformSourceExclusion: true,
  excludeAlcohol: false,
  groupBy: 'meta',
  offset: 0,
}

export const DELAY_FROM = 400
export const DELAY_TO = 1000

export const LIMIT_FROM = 100
export const LIMIT_TO = 140
