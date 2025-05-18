import { RawAxiosRequestHeaders } from 'axios'
import { PriceCategory } from '../../types'
import { IIgooodsSort, IIgooodsSortOrder } from './types'

const API_VERSION = 'v10'

export const MAIN_URL = 'https://www.igooods.ru'

export const DEFAULT_REQUEST_HEADERS: RawAxiosRequestHeaders = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'ru,ru-RU;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'Content-Type': 'application/json',
  'Upgrade-Insecure-Requests': '1',
  'X-Http-Referrer': 'https://igooods.page.link/',
  'X-Platform': 'web',
  'X-Type': 'desktop',
}

export const getShopsUrl = (apiVersion: string = API_VERSION) => `${MAIN_URL}/api/${apiVersion}/shops`
export const getProductsUrl = (shopId: string, apiVersion: string = API_VERSION) => `${getShopsUrl(apiVersion)}/${shopId}/products/search`

export const PRICE_CATEGORY_TO_SORT_FIELDS_MAP: {
  [key in PriceCategory]: { sort: IIgooodsSort; sortOrder: IIgooodsSortOrder }
} = {
  cheapest: {
    sort: 'price',
    sortOrder: 'asc',
  },
  popular: {
    sort: 'popularity',
    sortOrder: 'desc',
  },
  mostExpensive: {
    sort: 'price',
    sortOrder: 'desc',
  },
}
