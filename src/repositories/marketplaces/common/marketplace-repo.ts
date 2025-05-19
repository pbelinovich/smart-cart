import https, { RequestOptions } from 'node:https'
import http, { Agent } from 'node:http'
import { decompressResponse, isHttps } from './helpers'
import { IMarketplaceRequestParams, QueryObject } from './types'
import { fingerprintGenerator } from '@shared'
import { SocksProxyAgent } from 'socks-proxy-agent'

export abstract class MarketplaceRepo {
  private readonly agent: Agent | undefined
  protected fingerprint = fingerprintGenerator()

  protected constructor(proxy?: string) {
    if (proxy) {
      this.agent = new SocksProxyAgent(proxy)
    }

    setInterval(() => {
      this.fingerprint = fingerprintGenerator()
    }, 1000 * 60 * 30)
  }

  private objectToQueryString = (obj: QueryObject, prefix: string = ''): string => {
    const queryParts: string[] = []

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key]
        const fullKey = prefix ? `${prefix}[${key}]` : key

        if (value === null || value === undefined) {
          continue
        } else if (Array.isArray(value)) {
          value.forEach(item => {
            if (item !== null && item !== undefined) {
              if (typeof item === 'object' && !Array.isArray(item)) {
                // Обработка массива объектов
                const nestedQuery = this.objectToQueryString(item, fullKey)
                if (nestedQuery) {
                  queryParts.push(nestedQuery)
                }
              } else {
                queryParts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(item))}`)
              }
            }
          })
        } else if (typeof value === 'object') {
          // Рекурсивный вызов для вложенных объектов
          const nestedQuery = this.objectToQueryString(value as QueryObject, fullKey)
          if (nestedQuery) {
            queryParts.push(nestedQuery)
          }
        } else {
          queryParts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`)
        }
      }
    }

    return queryParts.join('&')
  }

  protected request = <TData extends { [key: string]: any }, TResult>(p: IMarketplaceRequestParams<TData>) => {
    let timeout = false

    return new Promise<TResult>((resolve, reject) => {
      const protocol = isHttps(p.url) ? https : http
      const url = new URL(p.url)

      let path = url.pathname

      if (p.method === 'GET') {
        const params = this.objectToQueryString(p.data)

        if (params) {
          path += '?' + params.toString()
        }
      }

      const options: RequestOptions = {
        method: p.method,
        hostname: url.hostname,
        path,
        headers: {
          Accept: '*/*',
          'Cache-Control': 'no-cache',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Content-Type': 'application/json',
          ...p.headers,
        },
        agent: this.agent,
        timeout: p.timeout || 15000,
      }

      const req = protocol.request(options, res => {
        const data: any[] = []

        res.on('data', chunk => {
          data.push(chunk)
        })

        res.on('end', async () => {
          try {
            const buffer = Buffer.concat(data)
            const decompressed = await decompressResponse(res, buffer)
            resolve(JSON.parse(decompressed))
          } catch (e) {
            reject(e)
          }
        })
      })

      req.on('timeout', () => {
        timeout = true
        reject(new Error('Timeout'))
      })

      req.on('error', e => {
        if (!timeout) {
          reject(e)
        }
      })

      if (p.method === 'POST') {
        req.write(JSON.stringify(p.data))
      }

      req.end()
    })
  }
}
