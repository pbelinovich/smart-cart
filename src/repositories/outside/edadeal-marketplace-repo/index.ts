import axios, { RawAxiosRequestHeaders } from 'axios'
import http from 'node:http'
import https from 'node:https'
import zlib from 'zlib'
import { SocksProxyAgent } from 'socks-proxy-agent'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import SessionPlugin, { StorageProviderName } from 'puppeteer-extra-plugin-session'
import { CartsMap, IGetCartsParams, IMarketplace, IProduct, IAIProduct } from '../../types'
import { delay, fingerprintGenerator, IFingerprint } from '@shared'
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
import { getRequest } from './http-helpers'

puppeteer.use(StealthPlugin())
puppeteer.use(SessionPlugin())

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

const getRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const shuffleObjectKeys = <T extends object>(obj: T): T => {
  const keys = Object.keys(obj) as (keyof T)[]

  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[keys[i], keys[j]] = [keys[j], keys[i]]
  }

  const shuffled = {} as T

  for (const key of keys) {
    shuffled[key] = obj[key]
  }

  return shuffled
}

const decompressResponse = (res: http.IncomingMessage, data: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const encoding = res.headers['content-encoding']

    if (!encoding) return resolve(data.toString())

    const decompressor =
      encoding === 'gzip'
        ? zlib.createGunzip()
        : encoding === 'deflate'
        ? zlib.createInflate()
        : encoding === 'br'
        ? zlib.createBrotliDecompress()
        : null

    if (!decompressor) return resolve(data.toString())

    let result = ''
    decompressor
      .on('data', chunk => (result += chunk))
      .on('end', () => resolve(result))
      .on('error', reject)

    decompressor.write(data)
    decompressor.end()
  })
}

export class EdadealMarketplaceRepo implements IMarketplace<IEdadealGetProductsResponse> {
  private request = async <TParams, TResult>({
    method = 'GET',
    url,
    data,
    // userAddress,
    proxy,
    fingerprint,
  }: IEdadealRequestParams<TParams>) => {
    try {
      // const fingerprint = fingerprintGenerator()
      const headers = {
        // ...DEFAULT_REQUEST_HEADERS,
        // 'User-Agent': fingerprint.userAgent,
        // 'X-Position-Latitude': 53.2437786,
        // 'X-Position-Longitude': 50.2438095,
        'x-position-latitude': '53.195875999997774',
        'x-position-longitude': '50.100198999999996',
        // 'User-Agent': 'PostmanRuntime/7.43.4',
        // 'User-Agent': 'PostmanRuntime/7.43.4',
        'User-Agent': fingerprint.userAgent,
        Accept: '*/*',
        'Cache-Control': 'no-cache',
        Host: 'search.edadeal.io',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
      }

      const params = new URLSearchParams({
        addContent: 'true',
        allNanoOffers: 'false',
        checkAdult: 'false',
        disablePlatformSourceExclusion: 'true',
        excludeAlcohol: 'false',
        groupBy: 'meta',
        limit: '140',
        offset: '0',
        text: (data as any)?.['text'] || 'сметана',
      })

      const options = {
        proxy,
        hostname: 'search.edadeal.io',
        path: '/api/v4/search?' + params.toString(),
        method: 'GET',
        headers,
      }

      const promise = new Promise((resolve, reject) => {
        const req = https.request(options, res => {
          // console.log(`Статус ответа: ${res.statusCode}`)
          // console.log('Заголовки:', res.headers)

          const data: any[] = []

          res.on('data', chunk => {
            data.push(chunk)
          })

          res.on('end', async () => {
            try {
              const buffer = Buffer.concat(data)
              const decompressed = await decompressResponse(res, buffer)
              // Если ответ в JSON
              const parsedData = JSON.parse(decompressed)
              // console.log('!!Тело ответа PARSED:', parsedData)
              resolve(parsedData)
            } catch (e) {
              // Если не JSON
              // console.log('!!Тело ответа:', data)
            }
          })
        })

        req.on('error', error => {
          // console.log('!!Ошибка:', error)
          reject(error)
        })

        req.end()
      })

      /* return getRequest(
        PRODUCTS_URL,
        {
          addContent: 'true',
          allNanoOffers: 'false',
          checkAdult: 'false',
          disablePlatformSourceExclusion: 'true',
          excludeAlcohol: 'false',
          groupBy: 'meta',
          limit: '140',
          offset: '0',
          text: 'сметана',
        },
        { headers: options.headers }
      ) */

      // const response = await axios<TResult>(url, { method, headers, params: data, timeout: 15000 })
      // const response = await fetch(url + '?' + new URLSearchParams(data as any), { headers: headers2, method: 'GET' })
      // console.log('!!', url, JSON.stringify(response.headers))

      return await promise

      // return response.json()
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

    /* await browser.setCookie(
      {
        name: '_ym_uid',
        value: '1747401653130920553',
        domain: '.edadeal.ru',
        path: '/',
        expires: 1778937657.786517,
        httpOnly: false,
        secure: true,
      },
      {
        name: '_ym_d',
        value: '1747401653',
        domain: '.edadeal.ru',
        path: '/',
        expires: 1778937657.786551,
        httpOnly: false,
        secure: true,
      },
      {
        name: '_ym_isad',
        value: '1',
        domain: '.edadeal.ru',
        path: '/',
        expires: 1778937657.786578,
        httpOnly: false,
        secure: true,
      },
      {
        name: 'bh',
        value:
          'EkEiQ2hyb21pdW0iO3Y9IjEzNiIsICJHb29nbGUgQ2hyb21lIjt2PSIxMzYiLCAiTm90LkEvQnJhbmQiO3Y9Ijk5IioCPzA6ByJtYWNPUyJgtfecwQZqIdzK0bYBu/GfqwT61obMCNLR7esD/Lmv/wff/YeOBfOBAg==',
        domain: '.edadeal.ru',
        path: '/',
        expires: 1781961653.165653,
        httpOnly: false,
        secure: true,
      },
      {
        name: '_ym_visorc',
        value: 'b',
        domain: '.edadeal.ru',
        path: '/',
        expires: 1747403458,
        httpOnly: false,
        secure: true,
      },
      {
        name: 'spravka',
        value:
          'dD0xNzQ3NDAxNjU1O2k9MTg1LjE1Ni4xMDguNzQ7RD01NEMyMjcyQkVFRTZBOTA1QzI5ODIyMEIyNDQwMTMwNTNEOUM4MkZBQzRDNEVFQ0M2ODQwQzM2REQ5QTRCRDQ0RUU1QzdEQzg0MjJGODgzNjlGMkVFRUIyMDM0RkY5RTIyODgzMUYzMUNGQTZDNUU3ODQzNkQ2Mzg0RjM4NDNEQjk5REQ3N0U0NjYxRUI2NTRCNkRGRDU4Mzc3MzhCOUZCRjkyNURCODFCRTRFOEQ2QTEzMzg7dT0xNzQ3NDAxNjU1MzQxMzMxNzQwO2g9ODI3ODY5ODE3YjY1NjBlOGMyNTJkNzcxZjU4ZjliMzA=',
        domain: '.edadeal.ru',
        path: '/',
        expires: 1749993655,
        httpOnly: false,
        secure: false,
      },
      {
        name: '_yasc',
        value: '2wd4gmSAiB7at6ndW1WQ9L7GHd+miBGdaSXk55ZTH89WE5qUx0OYlNeeY1ppXNgvxnRc+2OJ',
        domain: '.edadeal.ru',
        path: '/',
        expires: 1781961655.347734,
        httpOnly: false,
        secure: true,
      },
      {
        name: 'Session_id',
        value:
          '3:1747401656.5.1.1677485883276:H9VCsg:2c.1.2:1|701508127.0.2.3:1677485883|1130000066458777.35075455.2.2:35075455.3:1712561338|46:10060302.411257.s1pr0QusAuRlsFlOtwNyafwzTOA',
        domain: '.edadeal.ru',
        path: '/',
        expires: 1781961657.581382,
        httpOnly: true,
        secure: true,
      },
      {
        name: 'sessar',
        value: '1.1202.CiCjy-WDSyBY0W70Yd0bPIdQwvkPkhPPrx4LzuC6-vUaoA.OiIh4wU5s1uK2tue-RebRSsbGlCmAsO69cDBQPpbpyw',
        domain: '.edadeal.ru',
        path: '/',
        expires: 1781961657.581771,
        httpOnly: true,
        secure: true,
      },
      {
        name: 'yandex_login',
        value: 'pbelinovich@jtc.ooo',
        domain: '.edadeal.ru',
        path: '/',
        expires: 1778937657.582335,
        httpOnly: false,
        secure: true,
      },
      {
        name: 'ys',
        value: 'udn.cDpwYmVsaW5vdmljaEBqdGMub29v#c_chck.24005227',
        domain: '.edadeal.ru',
        path: '/',
        expires: -1,
        httpOnly: false,
        secure: true,
      },
      {
        name: 'i',
        value: 'hdkZ7HtcPB8iHVoQCC1YU2u/f/sy/7e9n6lLPOcbeJTalmlkqZvahOMSQI2uiNMZQkrndeZaKHFVfUp95E+T0pMffBY=',
        domain: '.edadeal.ru',
        path: '/',
        expires: 1781961657.582521,
        httpOnly: true,
        secure: true,
      },
      {
        name: 'yandexuid',
        value: '2318150481677241851',
        domain: '.edadeal.ru',
        path: '/',
        expires: 1781961657.582611,
        httpOnly: false,
        secure: true,
      },
      {
        name: 'L',
        value: 'SilZdncJfGIASFFBQF51XUh9DnJRWAxFEi9VHg0dAz4xDywHIxs6WQE3WA==.1747301750.16150.336102.a86974bddd70178169e063061c41d925',
        domain: '.edadeal.ru',
        path: '/',
        expires: 1781961657.582732,
        httpOnly: false,
        secure: false,
      },
      {
        name: 'mda2_beacon',
        value: '1747401656870',
        domain: '.edadeal.ru',
        path: '/',
        expires: 1781961657.582877,
        httpOnly: false,
        secure: true,
      },
      {
        name: 'sso_status',
        value: 'sso.passport.yandex.ru:synchronized',
        domain: '.edadeal.ru',
        path: '/',
        expires: 1747412457,
        httpOnly: false,
        secure: false,
      },
      {
        name: 'edid',
        value:
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzUxMiJ9.eyJkdWlkIjoiNzM4MzdlY2IyNmZlNDQ3YjhkOTM0YWM0ZjRmMzAwZTkiLCJ2cnQiOjEsImV4cCI6MjA0OTE5Njg1NywibmJmIjoxNzQ3NDAxNjM3fQ.iTV30MJ1x1YsjtCV7648_Ltq57gTL9r1egt-D3ZuSMoPBAAl4d9O7de39KIpvV4RoyKM8A_wOTZNifcM0IhvMkIIIIHREWZ2I84YP1RK41ZWRlFBCTcFWnxZbGAO4FKaozVhHCuA-PQzfiDNrhpBBEc63ChbWvu61_N0CPu_L0Q',
        domain: '.edadeal.ru',
        path: '/',
        expires: -1,
        httpOnly: true,
        secure: true,
      },
      {
        name: 'gdpr',
        value: '0',
        domain: '.edadeal.ru',
        path: '/',
        expires: 1778937658,
        httpOnly: false,
        secure: true,
      },
      {
        name: 'v4ls',
        value:
          'locale%7B%7B.%7D%7D%22ru%22%7B%7B%23%7D%7DisLocaleDef%7B%7B.%7D%7Dtrue%7B%7B%23%7D%7DcolorTheme%7B%7B.%7D%7D%7B%22value%22%3A%22light%22%2C%22isSystem%22%3Afalse%7D%7B%7B%23%7D%7Dplatform.selectedLocalityGeoId%7B%7B.%7D%7D%22213%22%7B%7B%23%7D%7DadultContentAllowed%7B%7B.%7D%7D%22false%22',
        domain: 'edadeal.ru',
        path: '/',
        expires: 1781961659.140257,
        httpOnly: false,
        secure: false,
      }
    ) */

    const page = await browser.newPage()

    /* await page.setBypassCSP(true)

    const localSt: { [key: string]: string } = {}
    const setLocalStItem = (key: string, value: string) => {
      localSt[key] = value
    }

    const sessionSt: { [key: string]: string } = {}
    const setSessionStItem = (key: string, value: string) => {
      sessionSt[key] = value
    }

    setLocalStItem('_ym34675050:0_reqNum', '4')
    setLocalStItem('_ym34675050_lastHit', '1747399924461')
    setLocalStItem('_ym34675050_lsid', '1628168739410')
    setLocalStItem('_ym_retryReqs', '{}')
    setLocalStItem('_ym_synced', '{"com":29123317,"mc.edadeal.ru":29123317}')
    setLocalStItem('_ym_uid', '1747399056811234246')
    setLocalStItem('_ym_wv2rf:34675050:0', '0')

    setSessionStItem(
      '[[BROWSER_HISTORY]].log',
      '[{"route":"/moskva/offers/search","params":{"name":"dsk-offers-search","params":{"locality":"moskva"},"query":{"keywords":"хлеб","page":null},"meta":{"path":"/:locality?/offers/search","component":"p-dsk-offers-search","meta":{"globalHeadersConfig":[{"component":"b-dsk-back-header","key":0}]},"name":"dsk-offers-search","default":false,"external":false,"globalHeadersConfig":[{"component":"b-dsk-back-header","key":0}]},"pattern":"/:locality?/offers/search","rgxp":{},"pathParams":[{"name":"locality","prefix":"/","delimiter":"/","optional":true,"repeat":false,"pattern":"[^\\\\/]+?","aliases":[]}],"page":"dsk-offers-search","_id":"fd375ea9df651"}}]'
    )
    setSessionStItem('[[BROWSER_HISTORY]].pos', '0')
    setSessionStItem('__ym_tab_guid', 'c3018f69-8a0b-7e68-9a3f-8308f484285e')

    await page.session.restoreString(JSON.stringify(localSt), { storageProviders: [StorageProviderName.LocalStorage] })
    await page.session.restoreString(JSON.stringify(sessionSt), { storageProviders: [StorageProviderName.SessionStorage] }) */

    await page.setUserAgent(fingerprint.userAgent)
    await page.setViewport(fingerprint.viewport)

    const headers: RawAxiosRequestHeaders = {
      ...DEFAULT_REQUEST_HEADERS,
      'User-Agent': fingerprint.userAgent,
      'X-Position-Latitude': mockCoordinates.spb.latitude.toString(),
      'X-Position-Longitude': mockCoordinates.spb.latitude.toString(),
    }

    await page.setExtraHTTPHeaders(headers as any)

    await page.setRequestInterception(true)

    page.on('request', async request => {
      const url = request.url()
      const headers = request.headers()
      const blockedResources = ['image', 'stylesheet', 'font', 'media']

      if (url.includes('usr.edadeal.ru/auth/v1/autologin')) {
        console.log('!!', 'found req')
        return request.continue({
          method: 'POST',
          postData: JSON.stringify({ ui: 'desktop' }),
          headers: {
            ...request.headers(),
            'Content-Type': 'application/json',
          },
        })
      }

      if (url.includes('edadeal.ru')) {
        // console.log('!!', url, JSON.stringify(headers))
      }

      if (!url.includes('yastatic') && !blockedResources.includes(request.resourceType())) {
        // console.log('!!', url)
      }

      blockedResources.includes(request.resourceType()) ? await request.abort() : await request.continue()
    })

    page.on('response', response => {
      if (response.url().includes('usr.edadeal.ru/auth/v1/autologin')) {
        // console.log('!!', 'found res')
        const headers = response.headers()
        // console.log('!! Заголовки ответа:', JSON.stringify(headers))

        // Если вам нужен конкретный заголовок (например, 'set-cookie')
        const setCookieHeader = headers['set-cookie']
        if (setCookieHeader) {
          // await page.setCookie()
          // console.log('!! Set-Cookie:', setCookieHeader)
        }
      }
    })

    // await page.goto('https://edadeal.ru/moskva/offers/search?keywords=%D1%85%D0%BB%D0%B5%D0%B1', { waitUntil: 'domcontentloaded' })

    /* await page.setCookie({
      name: '_yasc',
      value: '+/WfimB9Ht09SztQWu64BsT7usiDTOWPJ/+zpF9opuEeepyTU2cp0Zjxfuucx5Ccbw==',
      domain: 'edadeal.ru',
      path: '/',
      httpOnly: false,
      secure: true,
    }) */

    /* const auth = await page.goto('https://usr.edadeal.ru/auth/v1/autologin', { waitUntil: 'domcontentloaded' })

    await page.setCookie({
      name: 'edadeal_auth',
      value:
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkdWlkIjoiNDAwN2IzNTktOGVjMy00MTEyLTgxZTYtZTUyZDA4MWZlZGVjIiwiYXVkIjoidXNyIiwiZXhwIjoxNzc5MDA3NDE0LCJqdGkiOiJkMDczMjc3My1iNTI0LTRlOGYtOTM3ZS0yZTc3ZjMwN2YzZDgiLCJpYXQiOjE3NDc1NTc4MTQsImlzcyI6Imh0dHBzOi8vdXNyLmVkYWRlYWwucnUiLCJuYmYiOjE3NDc1NTc4MTQsInN1YiI6Imh0dHBzOi8vdXNyLmVkYWRlYWwucnUifQ.PN78Qumc9LGeIL5zZO89eRUi4-hOUJtpq_XHgJgRVyk5wcf8mdH_y00NKBsztEfbr4T1CYZ0TtnIIP9S1q933kGDAigrnQICfQQ9viAXAbWPgicm8alQgUERq9m_rYF_Sdhvo2mx2kbwnNVrBTxdQTAqhtIfcetk0BAAxSxiDvM',
      domain: '.edadeal.ru',
      httpOnly: true,
      secure: true,
    })

    const cookies = await browser.cookies()
    console.log('!!cookies', cookies) */

    // console.log('!!auth', auth.)

    // const resp = await page.goto('https://usr.edadeal.ru/auth/v1/autologin?ui=desktop', {})
    /* const fingerprint2 = fingerprintGenerator()
    const resp = await axios({
      url: 'https://usr.edadeal.ru/auth/v1/autologin?ui=desktop',
      method: 'POST',
      data: { ui: 'desktop' },
      headers: {
        ...DEFAULT_REQUEST_HEADERS,
        'User-Agent': fingerprint2.userAgent,
      },
      proxy: {
        host: '195.96.150.5',
        port: 2673,
        auth: {
          username: 'user291075',
          password: '0f3s8i',
        },
      },
    })

    console.log('!!resp', resp.headers) &/

    // resp


    /* const res = await page.goto('https://edadeal.ru/moskva/offers/search?keywords=%D1%85%D0%BB%D0%B5%D0%B1', {
      waitUntil: 'domcontentloaded',
    }) */

    // const uint8Array = await res?.content()
    // const decoder = new TextDecoder()
    // const jsonString = decoder.decode(uint8Array)

    // console.log('!!jsonString', jsonString)

    try {
      const proxy = new SocksProxyAgent('socks5h://user291075:0f3s8i@195.96.150.5:2673')

      const firstUsersProducts: IAIProduct[] = []
      const secondUsersProducts: IAIProduct[] = []

      params.userProducts.forEach((userProduct, index) => {
        if (index < 5) {
          secondUsersProducts.push(userProduct)
        } else {
          firstUsersProducts.push(userProduct)
        }
      })

      const run = async (entryUserProducts: IAIProduct[], entryProxy?: SocksProxyAgent) => {
        const fingerprint = fingerprintGenerator()
        let i = 0
        let userProducts = Array.from(entryUserProducts)

        while (userProducts.length) {
          // let randomNumber: number | undefined

          // if (!firstTime) {
          // Генерируем случайное число от 400 до 1000 (включительно)
          const randomNumber = getRandomNumber(400, 1000)
          // if (i % 3 === 0) {
          // console.log('!!', `ждем ${(randomNumber / 1000).toFixed()} сек`)
          await delay(randomNumber)
          // }

          if (i % 3 === 0) {
            // console.log('!!', 'ждем 10 сек')
            // await delay(10000)
          }
          // }

          const [userProduct, ...restUserProducts] = userProducts
          const userProductIndex = i.toString()

          const requestParams: any = {
            ...DEFAULT_GET_PRODUCTS_PARAMS,
            text: userProduct.name,
            // segmentUuid: '3b31b1a8-6311-11e6-849f-52540010b602',
            // allNanoOffers: Boolean(getRandomNumber(0, 1)),
            // checkAdult: Boolean(getRandomNumber(0, 1)),
            // disablePlatformSourceExclusion: Boolean(getRandomNumber(0, 1)),
            // excludeAlcohol: Boolean(getRandomNumber(0, 1)),
            // limit: getRandomNumber(80, 140),
            // offset: getRandomNumber(0, 10),
          }
          const sort = PRICE_CATEGORY_TO_SORT_FIELDS_MAP[userProduct.priceCategory]

          if (sort) {
            requestParams.sort = encodeURIComponent(sort) as EdadealSort // тут прикол в api, без encodeURIComponent не работает
          }

          /* const response = await this.request<IEdadealGetProductsRequestParams, IEdadealGetProductsResponse>({
            index: i,
            url: PRODUCTS_URL,
            data: requestParams,
            userAddress: params.userAddress,
          }) */

          let result: any

          try {
            // const response = await page.goto(PRODUCTS_URL + '?' + new URLSearchParams(requestParams))
            result = await this.request<any, any>({
              url: PRODUCTS_URL,
              data: requestParams,
              index: i,
              method: 'GET',
              proxy: entryProxy,
              fingerprint,
            })
            // console.log('!!status', response?.status())
            // result = await response?.json()
          } catch (e) {
            // console.log('!!err', e)
          }

          console.log('!!response', i, userProduct.name, JSON.stringify(result?.total))

          if (!result) {
            // await page.goto('https://susanin.edadeal.ru/api/v2/locate?countries=225&kind=locality&lang=ru')

            if (!restUserProducts.length) {
              break
            } else {
              userProducts = [...restUserProducts, { ...userProduct, name: `"${userProduct.name}"` }]
            }

            // await delay(5000)
            /* const coordinates = getRandomNumber(0, 1) ? mockCoordinates.spb : mockCoordinates.samara
            await page.setExtraHTTPHeaders({
              ...headers,
              'X-Position-Latitude': coordinates.latitude.toString(),
              'X-Position-Longitude': coordinates.longitude.toString(),
            } as any) */

            /* let count = 0

            while (count < 10) {
              await delay(1000)

              const leftStrings = ['молоко', 'яйца', 'хлеб', 'чипсы lays', 'картошка 1кг', 'сыр', 'рис', 'гречка']
              // const leftText = leftStrings[Math.floor(Math.random() * (leftStrings.length - 1 + 1)) + 1] || 'фрукты'
              const leftText = leftStrings[0]

              try {
                const response = await page.goto(PRODUCTS_URL + '?' + new URLSearchParams(requestParams as any))
                result = await response?.json()
              } catch (e) {}

              console.log('!!leftResponse', count, leftText, JSON.stringify(result?.total))

              if (result) {
                break
              }

              count += 1
            } */

            continue
          }

          // console.log('!!products', result.items?.map((x: any) => x.uuid)?.length)

          for (const product of result.items) {
            const shopId = product.partner.uuid

            if (!shopsMap[shopId]) {
              shopsMap[shopId] = { partner: product.partner, productsMap: {} }
            }

            if (!shopsMap[shopId].productsMap[userProductIndex]) {
              shopsMap[shopId].productsMap[userProductIndex] = []
            }

            shopsMap[shopId].productsMap[userProductIndex].push(product)
          }

          i += 1
          userProducts = restUserProducts
        }
      }

      await Promise.all([run(firstUsersProducts), run(secondUsersProducts, proxy)])

      await browser.close()
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

    return {
      carts: Object.values(cartsMap).sort((a, b) => (a.totalPrice < b.totalPrice ? -1 : 1)),
      responses: [],
    }
  }
}
