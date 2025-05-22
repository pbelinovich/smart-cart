import { PriceCategory } from '../../types'
import { EdadealSort, IEdadealExternalCitiesSearchRequest, IEdadealExternalProductsSearchRequest } from './types'
import { OutgoingHttpHeaders } from 'node:http'

export const PRODUCTS_SEARCH_URL = 'https://search.edadeal.io/api/v4/search'
export const CITIES_SEARCH_URL = 'https://geopicker.edadeal.ru/api/v1/search'
export const CHERCHER_SEARCH_URL = 'https://search.edadeal.io/api/v4/zoom'

export const DEFAULT_REQUEST_HEADERS: OutgoingHttpHeaders = {
  'X-Platform': 'desktop',
}

export const PRICE_CATEGORY_TO_SORT_FIELDS_MAP: { [key in PriceCategory]?: EdadealSort } = {
  cheapest: '-priceNew',
  mostExpensive: '+priceNew',
}

export const DEFAULT_CITIES_SEARCH_PARAMS: Omit<IEdadealExternalCitiesSearchRequest, 'q'> = {
  country_geo_id: '225',
  lang: 'ru',
}

export const DEFAULT_PRODUCTS_SEARCH_PARAMS: Omit<IEdadealExternalProductsSearchRequest, 'text' | 'limit'> = {
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
