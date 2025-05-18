import https, { RequestOptions } from 'node:https'
import http from 'node:http'
import { decompressResponse, isHttps } from './helpers'
import { IMarketplaceRequestParams } from './types'

export abstract class MarketplaceRepo {
  protected request = <TData extends { [key: string]: any }, TResult>(p: IMarketplaceRequestParams<TData>) => {
    let timeout = false

    return new Promise<TResult>((resolve, reject) => {
      const protocol = isHttps(p.url) ? https : http
      const url = new URL(p.url)

      let path = url.pathname

      if (p.method === 'GET') {
        const params = new URLSearchParams(
          Object.keys(p.data).reduce<{ [key: string]: string }>((acc, key) => {
            if (typeof p.data[key].toString === 'function') {
              acc[key] = p.data[key].toString()
            }

            return acc
          }, {})
        )

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
        agent: p.agent,
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
