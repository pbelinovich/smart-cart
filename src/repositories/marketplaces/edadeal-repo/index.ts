import { delay, fingerprintGenerator, random } from '@shared'
import { Agent } from 'node:http'
import { MarketplaceRepo } from '../common/marketplace-repo'
import { IMarketplaceRepo } from '../../types'
import { IEdadealGetProductsRequest, IEdadealGetProductsResponse, IEdadealSearchRequest } from './types'
import { DEFAULT_GET_PRODUCTS_PARAMS, DEFAULT_REQUEST_HEADERS, DELAY_FROM, DELAY_TO, SEARCH_URL } from './common'

export * from './types'

export class EdadealRepo extends MarketplaceRepo implements IMarketplaceRepo<IEdadealSearchRequest, IEdadealGetProductsResponse> {
  private fingerprint = fingerprintGenerator()

  constructor(private readonly agent?: Agent) {
    super()

    setInterval(() => {
      this.fingerprint = fingerprintGenerator()
    }, 1000 * 60 * 30)
  }

  search = async (params: IEdadealSearchRequest) => {
    await delay(random(DELAY_FROM, DELAY_TO))

    return this.request<IEdadealGetProductsRequest, IEdadealGetProductsResponse>({
      method: 'GET',
      url: SEARCH_URL,
      headers: {
        ...DEFAULT_REQUEST_HEADERS,
        'User-Agent': this.fingerprint.userAgent,
        'X-Position-Latitude': params.city.coordinates.latitude.toString(),
        'X-Position-Longitude': params.city.coordinates.longitude.toString(),
      },
      agent: this.agent,
      data: {
        ...DEFAULT_GET_PRODUCTS_PARAMS,
        retailerUuid: params.shopIds,
        sort: params.sort,
        text: params.text,
      },
    })
  }
}
