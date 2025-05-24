import { delay, random } from '@shared'
import { MarketplaceRepo } from '../common/marketplace-repo'
import { ICoordinates, IMarketplaceRepo } from '../../types'
import {
  IEdadealExternalProductsSearchRequest,
  IEdadealProductsSearchResponse,
  IEdadealProductsSearchRequest,
  IEdadealCitiesSearchRequest,
  EdadealCitiesSearchResponse,
  IEdadealExternalCitiesSearchRequest,
  IEdadealGetChercherResponse,
  IEdadealGetChercherRequest,
} from './types'
import {
  CHERCHER_SEARCH_URL,
  CITIES_SEARCH_URL,
  DEFAULT_CITIES_SEARCH_PARAMS,
  DEFAULT_PRODUCTS_SEARCH_PARAMS,
  DEFAULT_REQUEST_HEADERS,
  DELAY_FROM,
  DELAY_TO,
  LIMIT_FROM,
  LIMIT_TO,
  PRODUCTS_SEARCH_URL,
} from './common'
import { OutgoingHttpHeaders } from 'node:http'

export * from './types'

type EdadealMarketplaceRepo = IMarketplaceRepo<IEdadealProductsSearchRequest, IEdadealProductsSearchResponse>

export class EdadealRepo extends MarketplaceRepo implements EdadealMarketplaceRepo {
  constructor(proxy?: string) {
    super(proxy)
  }

  private wait = () => {
    return delay(random(DELAY_FROM, DELAY_TO))
  }

  private getHeaders = (coordinates?: ICoordinates, custom: Record<string, string> = {}) => {
    const result: OutgoingHttpHeaders = {
      ...DEFAULT_REQUEST_HEADERS,
      'User-Agent': this.fingerprint.userAgent,
      ...custom,
    }

    if (coordinates) {
      result['X-Position-Latitude'] = coordinates.latitude.toString()
      result['X-Position-Longitude'] = coordinates.longitude.toString()
    }

    return result
  }

  searchCities = async (params: IEdadealCitiesSearchRequest) => {
    await this.wait()

    return this.request<IEdadealExternalCitiesSearchRequest, EdadealCitiesSearchResponse>({
      method: 'GET',
      url: CITIES_SEARCH_URL,
      headers: this.getHeaders(),
      data: {
        ...DEFAULT_CITIES_SEARCH_PARAMS,
        q: params.query,
      },
    })
  }

  getChercherArea = async (params: IEdadealGetChercherRequest) => {
    await this.wait()

    return this.request<void, IEdadealGetChercherResponse>({
      method: 'GET',
      url: CHERCHER_SEARCH_URL,
      headers: this.getHeaders(params.coordinates),
      data: undefined,
    })
  }

  searchProducts = async (params: IEdadealProductsSearchRequest) => {
    await this.wait()

    return this.request<IEdadealExternalProductsSearchRequest, IEdadealProductsSearchResponse>({
      method: 'GET',
      url: PRODUCTS_SEARCH_URL,
      headers: this.getHeaders(params.coordinates, { 'X-Edadeal-Chercher-Area': params.chercherArea }),
      // headers: this.getHeaders(params.coordinates),
      data: {
        ...DEFAULT_PRODUCTS_SEARCH_PARAMS,
        limit: random(LIMIT_FROM, LIMIT_TO),
        retailerUuid: params.shopIds,
        sort: params.sort,
        text: params.text,
      },
    })
  }
}
