import axios, { AxiosProxyConfig, RawAxiosRequestHeaders } from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { CartsMap, IGetCartsParams, IMarketplace, IProduct } from '../../types'
import { delay, fingerprintGenerator, fingerprintGeneratorByIndex } from '@shared'
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
// import puppeteer from 'puppeteer-extra'
// import StealthPlugin from 'puppeteer-extra-plugin-stealth'

// puppeteer.use(StealthPlugin())

export * from './types'

const mockCoordinates: { [key in 'spb' | 'samara']: { latitude: number; longitude: number } } = {
  // спб, проспект просвещения 33к1
  spb: {
    latitude: 60.050235,
    longitude: 30.3446621,
  },

  // самара, проспект Карла Маркса, 398
  samara: {
    latitude: 53.2437786,
    longitude: 50.2438095,
  },
}

export class EdadealMarketplaceRepo implements IMarketplace<IEdadealGetProductsResponse> {
  private request = async <TParams, TResult>({ index, method = 'GET', url, data, userAddress, proxy }: IEdadealRequestParams<TParams>) => {
    try {
      const fingerprint = fingerprintGeneratorByIndex(index)
      const coordinates = userAddress?.coordinates || mockCoordinates.spb
      const headers: RawAxiosRequestHeaders = {
        // ...DEFAULT_REQUEST_HEADERS,
        'User-Agent': fingerprint.userAgent,
        'X-Position-Latitude': coordinates.latitude,
        'X-Position-Longitude': coordinates.longitude,
      }

      if (userAddress) {
        // headers['X-Position-Latitude'] = userAddress.coordinates.latitude
        // headers['X-Position-Longitude'] = userAddress.coordinates.longitude
      }

      const response = await axios<TResult>({
        url,
        method,
        headers,
        params: data,
        timeout: 15000,
        // proxy,
        // httpsAgent: httpAgent,
      })

      console.log('!!', JSON.stringify(response))

      return response.data
    } catch (e) {
      // logError('Error making request:', e)
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

  private getShopsMap = async (params: IGetCartsParams) => {
    const shopsMap: EdadealShopsMap = {}
    const responses: IEdadealGetProductsResponse[] = []

    try {
      let i = 0
      let lastIndex = { index: i, count: 0 }
      let proxy: AxiosProxyConfig | undefined

      let userProducts = Array.from(params.userProducts)

      while (userProducts.length) {
        let randomNumber: number | undefined

        if (i > 0) {
          // Генерируем случайное число от 400 до 1000 (включительно)
          // randomNumber = Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000
          // if (i % 3 === 0) {
          // await delay(randomNumber)
          // }
        }

        const [userProduct, ...restUserProducts] = userProducts
        const userProductIndex = i.toString()
        const limit = Math.floor(Math.random() * (140 - 100 + 1)) + 100

        const requestParams: IEdadealGetProductsRequestParams = {
          ...DEFAULT_GET_PRODUCTS_PARAMS,
          text: userProduct.name,
          limit,
        }
        const sort = PRICE_CATEGORY_TO_SORT_FIELDS_MAP[userProduct.priceCategory]

        if (sort) {
          requestParams.sort = encodeURIComponent(sort) as EdadealSort // тут прикол в api, без encodeURIComponent не работает
        }

        const response = await this.request<IEdadealGetProductsRequestParams, IEdadealGetProductsResponse>({
          index: lastIndex.index + lastIndex.count,
          url: PRODUCTS_URL,
          data: requestParams,
          userAddress: params.userAddress,
          // proxy,
          fingerprint: fingerprintGenerator(),
        })

        console.log(
          '!!response',
          JSON.stringify(lastIndex),
          decodeURIComponent(userProduct.name),
          JSON.stringify(userProduct.name),
          JSON.stringify(response?.total),
          randomNumber,
          // Boolean(proxy),
          `limit: ${limit}`
        )

        if (!response) {
          let count = 0

          while (count < 10) {
            await delay(5000)

            const leftStrings = ['молоко', 'яйца', 'хлеб', 'чипсы lays', 'картошка 1кг', 'сыр', 'рис', 'гречка']
            const leftText = leftStrings[Math.floor(Math.random() * (leftStrings.length - 1 + 1)) + 1] || 'фрукты'
            const leftResponse = await this.request<IEdadealGetProductsRequestParams, IEdadealGetProductsResponse>({
              index: lastIndex.index + lastIndex.count + 1,
              url: PRODUCTS_URL,
              data: {
                ...requestParams,
                text: leftText,
              },
              userAddress: params.userAddress,
              // proxy,
              fingerprint: fingerprintGenerator(),
            })

            console.log('!!leftResponse', count, leftText, JSON.stringify(leftResponse?.total))

            if (leftResponse) {
              break
            }

            count += 1
          }

          if (userProducts.length === 1) {
            // await delay(5000)
            /* allNanoOffers = !allNanoOffers
            proxy = proxy
              ? undefined
              : {
                  host: '195.96.150.5',
                  port: 2673,
                  auth: {
                    username: 'user291075',
                    password: '0f3s8i',
                  },
                } */
          } else {
            // const [firstUserProduct, ...restUserProducts] = userProducts
            // userProducts = [...restUserProducts, userProduct]
            userProducts = [
              {
                ...userProduct,
                // name: encodeURIComponent(userProduct.name),
              },
              ...restUserProducts,
            ]
          }

          // httpAgent = httpAgent ? undefined : new HttpsProxyAgent('http://user291075:0f3s8i@195.96.150.5:2673')
          /* allNanoOffers = !allNanoOffers
          proxy = proxy
            ? undefined
            : {
                host: '195.96.150.5',
                port: 2673,
                auth: {
                  username: 'user291075',
                  password: '0f3s8i',
                },
              } */
          // await delay(5000)
          /* const texts = ['asd', 'qwe', 'zxc', '111', '555']
          // const randomIndex = Math.floor(Math.random() * (13 - 1 + 1)) + 1
          const randomProductIndex = Math.floor(Math.random() * (texts.length + 1))
          const text = texts[randomProductIndex] || 'qweqweqwe'
          await this.request<IEdadealGetProductsRequestParams, IEdadealGetProductsResponse>({
            index: lastIndex.index + lastIndex.count,
            url: PRODUCTS_URL,
            data: {
              ...requestParams,
              text,
            },
            userAddress: params.userAddress,
          }) */

          // console.log('!!response EMPTY', text)

          /* if (lastIndex.count < 5) {
            lastIndex.count += 1
          } else {
            i += 1
            lastIndex = { index: i, count: 0 }
          } */

          // i += 1
          // lastIndex = { index: i, count: 0 }

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

        responses.push(response)
        i += 1
        lastIndex = { index: i, count: 0 }
        userProducts = restUserProducts
      }

      /* for (let i = 0; i < params.userProducts.length; i++) {
        if (i > 0) {
          // Генерируем случайное число от 400 до 1000 (включительно)
          const randomNumber = Math.floor(Math.random() * (1000 - 400 + 1)) + 400
          // if (i % 3 === 0) {
          await delay(randomNumber)
          // }
        }

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

        console.log('!!response', response.searchText, response.total)

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

        responses.push(response)
      } */
    } catch (e) {
      logError('Error fetching shops map:', e)
    }

    return { shopsMap, responses }
  }

  getCarts = async (params: IGetCartsParams) => {
    const { shopsMap, responses } = await this.getShopsMap(params)

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

    return {
      carts: Object.values(cartsMap).sort((a, b) => (a.totalPrice < b.totalPrice ? -1 : 1)),
      responses,
    }
  }
}
