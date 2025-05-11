// import axios from 'axios'
// import { logError } from '../../external'
// import { fingerprintGenerator } from '@shared'
import { ICart, IMarketplace } from '../types'
/* import { SSRScraper } from './ssr-scraper'
import { DEFAULT_REQUEST_HEADERS, getProductsUrl, getShopsUrl, MAIN_URL, PRICE_CATEGORY_TO_SORT_FIELDS_MAP } from './common'
import {
  IIgooodsGetPageResponse,
  IIgooodsGetProductParams,
  IIgooodsGetProductsRequestParams,
  IIgooodsGetShopsParams,
  IIgooodsGetShopsRequestParams,
  IIgooodsProduct,
} from './types'
import { IAuthEntity } from '../../inside' */
// import puppeteer from 'puppeteer-extra'
// import StealthPlugin from 'puppeteer-extra-plugin-stealth'
// import { HttpsProxyAgent } from 'https-proxy-agent'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// import { proxyRequest } from 'puppeteer-proxy'
// import http from 'node:http'
// import Proxifly from 'proxifly/dist'

// puppeteer.use(StealthPlugin())

/* export class IgooodsMarketplaceRepo implements IMarketplace {
  private request123 = async <TParams, TResult>(auth: IAuthEntity, url: string, data: TParams) => {
    try {
      const fingerprint = fingerprintGenerator()

      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--no-zygote',
          '--single-process',
          '--disable-infobars',
          `--window-size=${fingerprint.viewport.width},${fingerprint.viewport.height}`,
          '--disable-features=IsolateOrigins,site-per-process',
          // '--proxy-server=http://195.96.150.5:2673',
        ],
        timeout: 30000,
      })
      const page = await browser.newPage()

      // await page.authenticate({ username: 'user291075', password: '0f3s8i' })

      await page.setUserAgent(fingerprint.userAgent)
      await page.setViewport(fingerprint.viewport)

      await page.setRequestInterception(true)

      page.on('request', async request => {
        const blockedResources = ['image', 'stylesheet', 'font', 'media']
        blockedResources.includes(request.resourceType()) ? await request.abort() : await request.continue()
        // console.log('!!request', JSON.stringify(request))
        await proxyRequest({
          page,
          proxyUrl: 'http://user291075:0f3s8i@195.96.150.5:2673',
          request,
        })
      })

      await page.goto(MAIN_URL, { waitUntil: 'domcontentloaded' })

      const cookies = await page.cookies()
      const authTokenCookie = cookies.find(c => c.name === 'authToken')
      const nextAuthData = authTokenCookie ? JSON.parse(decodeURIComponent(authTokenCookie.value)) : {}

      console.log('!!nextAuthData', nextAuthData)

      const asd = () =>
        axios(url, {
          httpAgent: new HttpsProxyAgent('http://user291075:0f3s8i@195.96.150.5:2673'),
          data,
          method: 'GET',
          timeout: 15000,
          headers: {
            ...DEFAULT_REQUEST_HEADERS,
            'User-Agent': fingerprint.userAgent,
            'X-User-Id': nextAuthData['id'],
            'X-User-Token': nextAuthData['token'],
            // 'X-User-Id': auth.authData['id'],
            // 'X-User-Token': auth.authData['token'],
          },
        })

      page.on('console', log => console.log(log.text()))

      await page.setExtraHTTPHeaders({
        ...DEFAULT_REQUEST_HEADERS,
        'User-Agent': fingerprint.userAgent,
        'X-User-Id': String(nextAuthData['id']),
        'X-User-Token': nextAuthData['token'],
      })

      const response = await page.goto(url + '?' + new URLSearchParams(data as any))
      const result = await response?.json()

      console.log('!!result', result)

      //  console.log('!!result', JSON.stringify(result))
      await browser.close()

      const res: any = undefined
      return res
      // return result
    } catch (e) {
      logError('Error making request:', e)
    }
  }

  private request = async <TParams, TResult>(auth: IAuthEntity, url: string, data: TParams) => {
    try {
      const fingerprint = fingerprintGenerator()

      const response = await axios<TResult>(url, {
        // httpAgent: new HttpsProxyAgent('http://user291075:0f3s8i@195.96.150.5:2673'),
        data,
        method: 'GET',
        timeout: 15000,
        headers: {
          ...DEFAULT_REQUEST_HEADERS,
          'User-Agent': fingerprint.userAgent,
          // 'X-User-Id': nextAuthData['id'],
          // 'X-User-Token': nextAuthData['token'],
          'X-User-Id': auth.authData['id'],
          'X-User-Token': auth.authData['token'],
        },
      })

      return response.data
    } catch (e) {
      logError('Error making request:', e)
    }
  }

  private getShops = async ({ auth, userAddress }: IIgooodsGetShopsParams): Promise<IShop[] | undefined> => {
    const response = await this.request<IIgooodsGetShopsRequestParams, IIgooodsGetPageResponse<IShop>>(auth, getShopsUrl(), {
      lng: userAddress.coordinates.longitude,
      lat: userAddress.coordinates.latitude,
      branding_support: true,
    })

    return response?.data.list.map(shop => ({ id: shop.id, name: shop.name }))
  }

  private getProduct = async ({ shopId, query, sort, sortOrder, auth }: IIgooodsGetProductParams): Promise<IIgooodsProduct | undefined> => {
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
      return { name: response.data.list[0].name, price: response.data.list[0].price }
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

  // getCarts2 = async ({ auth, userAddress, userProducts }: IGetCartsParams): Promise<ICart[]> => {
  // const
  // }

  getCarts = async ({ auth, userAddress, userProducts }: IGetCartsParams): Promise<ICart[]> => {
    // const shops = await this.getShops({ auth, userAddress })
    const shops = [{ id: '5', name: 'Лента' }]

    console.log('!!shops', JSON.stringify(shops))

    if (!shops) {
      return []
    }

    const cartsMap: { [shopId: string]: ICart } = {}

    const promises = shops.reduce<Promise<void>[]>((acc, shop) => {
      userProducts.forEach(userProduct => {
        acc.push(
          this.getProduct({
            ...PRICE_CATEGORY_TO_SORT_FIELDS_MAP[userProduct.priceCategory],
            auth,
            shopId: shop.id,
            query: userProduct.name,
          }).then(product => {
            console.log('!!product', shop.name, JSON.stringify(product))

            if (!product) {
              return
            }

            cartsMap[shop.id] = {
              shopId: shop.id,
              shopName: shop.name,
              products: [
                {
                  name: product.name,
                  quantity: userProduct.quantity,
                  price: product.price,
                },
              ],
              totalPrice: product.price * userProduct.quantity,
            }
          })
        )
      })

      return acc
    }, [])

    for (const shop of shops) {
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
} */

export class IgooodsMarketplaceRepo implements IMarketplace {
  getCarts = (): Promise<ICart[]> => {
    return Promise.resolve([])
  }
}
