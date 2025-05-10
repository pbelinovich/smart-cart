import { RawAxiosRequestHeaders } from 'axios'
import { UserPriceCategory } from '../../types'
import { IIgooodsSort, IIgooodsSortOrder } from './types'

const API_VERSION = 'v10'

export const MAIN_URL = 'https://www.igooods.ru/'

export const DEFAULT_REQUEST_HEADERS: RawAxiosRequestHeaders = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
  'Content-Type': 'application/json',
  'Upgrade-Insecure-Requests': '1',
}

export const getShopsUrl = (apiVersion: string = API_VERSION) => `${MAIN_URL}api/${apiVersion}/shops/`
export const getProductsUrl = (shopId: string, apiVersion: string = API_VERSION) => `${getShopsUrl(apiVersion)}${shopId}/products/search`

export const PRICE_CATEGORY_TO_SORT_FIELDS_MAP: {
  [key in UserPriceCategory]: { sort: IIgooodsSort; sortOrder: IIgooodsSortOrder }
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
