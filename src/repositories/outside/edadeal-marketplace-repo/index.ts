import axios, { RawAxiosRequestHeaders } from 'axios'
import { CartsMap, IGetCartsParams, IMarketplace, IProduct } from '../types'
import { fingerprintGenerator } from '@shared'
import { logError } from '../../external'
import { DEFAULT_GET_PRODUCTS_PARAMS, DEFAULT_REQUEST_HEADERS, PRICE_CATEGORY_TO_SORT_FIELDS_MAP, PRODUCTS_URL } from './common'
import {
  EdadealShopsMap,
  EdadealSort,
  IEdadealGetProductsRequestParams,
  IEdadealGetProductsResponse,
  IEdadealProduct,
  IEdadealRequestParams,
} from './types'

export class EdadealMarketplaceRepo implements IMarketplace {
  private request = async <TParams, TResult>({ method = 'GET', url, data, userAddress }: IEdadealRequestParams<TParams>) => {
    try {
      const fingerprint = fingerprintGenerator()
      const headers: RawAxiosRequestHeaders = {
        ...DEFAULT_REQUEST_HEADERS,
        'User-Agent': fingerprint.userAgent,
        'X-Position-Latitude': 53.2437786,
        'X-Position-Longitude': 50.2438095,
      }

      if (userAddress) {
        // headers['X-Position-Latitude'] = userAddress.coordinates.latitude
        // headers['X-Position-Longitude'] = userAddress.coordinates.longitude
      }

      const response = await axios<TResult>(url, { method, headers, params: data, timeout: 15000 })
      return response.data
    } catch (e) {
      logError('Error making request:', e)
    }
  }

  private getProductPrice = (product: IEdadealProduct | undefined): number => {
    const price = product?.priceForUnit?.price?.value?.value || 0
    return price
    // return price > 0 ? price / 100 : 0
  }

  private findCheapestProduct = (productList: IEdadealProduct[]): IEdadealProduct | undefined => {
    return productList.reduce<IEdadealProduct | undefined>((cheapest, current) => {
      const currentPrice = this.getProductPrice(current) || Infinity
      const cheapestPrice = this.getProductPrice(cheapest) || Infinity

      return currentPrice < cheapestPrice ? current : cheapest
    }, undefined)
  }

  private getShopsMap = async (params: IGetCartsParams): Promise<EdadealShopsMap> => {
    const shopsMap: EdadealShopsMap = {}

    try {
      for (let i = 0; i < params.userProducts.length; i++) {
        const userProduct = params.userProducts[i]
        const userProductIndex = i.toString()

        const requestParams: IEdadealGetProductsRequestParams = {
          ...DEFAULT_GET_PRODUCTS_PARAMS,
          text: userProduct.name,
        }
        const sort = PRICE_CATEGORY_TO_SORT_FIELDS_MAP[userProduct.priceCategory]

        if (sort) {
          requestParams.sort = encodeURIComponent(sort) as EdadealSort // тут прикол в api, без encodeURIComponent не работает
        }

        const response = await this.request<IEdadealGetProductsRequestParams, IEdadealGetProductsResponse>({
          url: PRODUCTS_URL,
          data: requestParams,
          userAddress: params.userAddress,
        })

        if (!response) {
          continue
        }

        for (const product of response.items) {
          const shopId = product.partner.uuid

          if (!shopsMap[shopId]) {
            shopsMap[shopId] = { partner: product.partner, productsMap: {} }
          }

          if (!shopsMap[shopId].productsMap[userProductIndex]) {
            shopsMap[shopId].productsMap[userProductIndex] = []
          }

          shopsMap[shopId].productsMap[userProductIndex].push(product)
        }
      }
    } catch (e) {
      logError('Error fetching shops map:', e)
    }

    return shopsMap
  }

  getCarts = async (params: IGetCartsParams) => {
    const shopsMap = await this.getShopsMap(params)

    // console.log('!!shopsMap', JSON.stringify(shopsMap, null, 2))

    const cartsMap: CartsMap = {}

    for (const shopId in shopsMap) {
      const { partner, productsMap } = shopsMap[shopId]

      const products: IProduct[] = []
      let totalPrice = 0

      for (const productIndex in productsMap) {
        const productList = productsMap[productIndex]
        const product = this.findCheapestProduct(productList)

        if (product) {
          const userProduct = params.userProducts[parseInt(productIndex)]
          const price = this.getProductPrice(product)
          const quantity = parseInt(userProduct.quantity)

          products.push({ name: product.title, quantity, price: price / 100 })
          totalPrice += price * quantity
        }
      }

      if (products.length !== params.userProducts.length || totalPrice === 0) {
        continue
      }

      cartsMap[shopId] = { shopId, shopName: partner.name, products, totalPrice: totalPrice / 100 }
    }

    // console.log('!!cartsMap', JSON.stringify(cartsMap, null, 2))

    return Object.values(cartsMap).sort((a, b) => (a.totalPrice < b.totalPrice ? -1 : 1))
  }
}
