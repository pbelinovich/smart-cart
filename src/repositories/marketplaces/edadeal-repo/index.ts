import { delay, random } from '@shared'
import { MarketplaceRepo } from '../common/marketplace-repo'
import { IMarketplaceRepo } from '../../types'
import { IEdadealGetProductsRequest, IEdadealGetProductsResponse, IEdadealSearchRequest } from './types'
import { DEFAULT_GET_PRODUCTS_PARAMS, DEFAULT_REQUEST_HEADERS, DELAY_FROM, DELAY_TO, LIMIT_FROM, LIMIT_TO, SEARCH_URL } from './common'

export * from './types'

export class EdadealRepo extends MarketplaceRepo implements IMarketplaceRepo<IEdadealSearchRequest, IEdadealGetProductsResponse> {
  constructor(proxy?: string) {
    super(proxy)
  }

  search = async (params: IEdadealSearchRequest) => {
    await delay(random(DELAY_FROM, DELAY_TO))

    return this.request<IEdadealGetProductsRequest, IEdadealGetProductsResponse>({
      method: 'GET',
      url: SEARCH_URL,
      headers: {
        ...DEFAULT_REQUEST_HEADERS,
        'User-Agent': this.fingerprint.userAgent,
        'X-Position-Latitude': params.coordinates.latitude.toString(),
        'X-Position-Longitude': params.coordinates.longitude.toString(),
      },
      data: {
        ...DEFAULT_GET_PRODUCTS_PARAMS,
        limit: random(LIMIT_FROM, LIMIT_TO),
        retailerUuid: params.shopIds,
        sort: params.sort,
        text: params.text,
      },
    })
  }
}
