import axios from 'axios'
import { logError } from '../../external'
import { fingerprintGenerator } from '@shared'
import { ICart, ICity, IGetCartsParams, IMarketplace, IShop } from '../types'
import { SSRScraper } from './ssr-scraper'
import { DEFAULT_REQUEST_HEADERS, getProductsUrl, getShopsUrl, MAIN_URL, PRICE_CATEGORY_TO_SORT_FIELDS_MAP } from './common'
import {
  IIgooodsGetPageResponse,
  IIgooodsGetProductParams,
  IIgooodsGetProductsRequestParams,
  IIgooodsGetShopsParams,
  IIgooodsGetShopsRequestParams,
  IIgooodsProduct,
} from './types'
import { IAuthEntity } from '../../inside'

export class IgooodsMarketplaceRepo implements IMarketplace {
  private request = async <TParams, TResult>(auth: IAuthEntity, url: string, data: TParams) => {
    try {
      const fingerprint = fingerprintGenerator()
      const response = await axios<TResult>(url, {
        data,
        method: 'GET',
        timeout: 5000,
        headers: {
          ...DEFAULT_REQUEST_HEADERS,
          'User-Agent': fingerprint.userAgent,
          'X-User-Id': auth.authData['id'],
          'X-User-Token': auth.authData['token'],
        },
      })

      return response.data
    } catch (e) {
      logError('Error making request:', e)
    }
  }

  private getShops = ({ auth, userAddress }: IIgooodsGetShopsParams) => {
    return this.request<IIgooodsGetShopsRequestParams, IIgooodsGetPageResponse<IShop>>(auth, getShopsUrl(), {
      lng: userAddress.coordinates.longitude,
      lat: userAddress.coordinates.latitude,
      branding_support: true,
    })
  }

  private getProduct = async ({ shopId, query, sort, sortOrder, auth }: IIgooodsGetProductParams) => {
    const response = await this.request<IIgooodsGetProductsRequestParams, IIgooodsGetPageResponse<IIgooodsProduct>>(
      auth,
      getProductsUrl(shopId),
      {
        limit: 1,
        sort,
        sort_order: sortOrder,
        pharmacy_support: true,
        query,
      }
    )

    if (response) {
      return response.data.list[0]
    }
  }

  getAuthData = async () => {
    try {
      const scraper = new SSRScraper()
      const ssrData = await scraper.scrape(MAIN_URL)

      if (!ssrData) {
        throw new Error('SSR data not found')
      }

      if (!ssrData.authToken) {
        throw new Error('Auth token not found')
      }

      return ssrData.authToken
    } catch (e) {
      logError('Error getting auth data:', e)
    }
  }

  getCities = async () => {
    let result: ICity[] = []

    try {
      const scraper = new SSRScraper()
      const ssrData = await scraper.scrape(MAIN_URL)

      if (!ssrData) {
        throw new Error('SSR data not found')
      }

      if (!ssrData.preloadedState) {
        throw new Error('Preloaded state not found')
      }

      const cities = ssrData.preloadedState['cities']

      if (!Array.isArray(cities)) {
        throw new Error('Cities data not found')
      }

      result = cities.map<ICity>(city => ({ id: city.id, name: city.name }))
    } catch (e) {
      logError('Error getting auth data:', e)
    }

    return result
  }

  getCarts = async ({ auth, userAddress, userProducts }: IGetCartsParams): Promise<ICart[]> => {
    const shops = await this.getShops({ auth, userAddress })

    console.log('!!shops', JSON.stringify(shops))

    if (!shops) {
      return []
    }

    const cartsMap: { [shopId: string]: ICart } = {}

    for (const shop of shops.data.list) {
      if (!cartsMap[shop.id]) {
        cartsMap[shop.id] = { shopId: shop.id, shopName: shop.name, products: [], totalPrice: 0 }
      }

      const cart = cartsMap[shop.id]

      for (const userProduct of userProducts) {
        const product = await this.getProduct({
          ...PRICE_CATEGORY_TO_SORT_FIELDS_MAP[userProduct.priceCategory],
          auth,
          shopId: shop.id,
          query: userProduct.name,
        })

        console.log('!!product', JSON.stringify(product))

        // TODO добавить пустой продукт в корзину
        if (!product) {
          continue
        }

        cart.products.push({
          name: product.name,
          quantity: userProduct.quantity,
          price: product.price,
        })

        cart.totalPrice += product.price * userProduct.quantity
      }
    }

    console.log('!!cartsMap', JSON.stringify(cartsMap))

    return Object.values(cartsMap)
  }
}
