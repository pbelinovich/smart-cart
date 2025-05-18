import http, { RequestOptions } from 'node:http'
import https from 'node:https'
import { logError } from '../../external'

const isHttps = (url: string | URL) => {
  if (typeof url === 'string') {
    return url.startsWith('https:')
  }
  return url.protocol === 'https:'
}

export const httpRequest = <T>(url: string | URL, body?: any, options?: RequestOptions) => {
  let timeout = false
  return new Promise<T>((resolve, reject) => {
    let output = ''
    const protocol = isHttps(url) ? https : http
    const req = protocol.request(
      typeof url === 'string' ? url : url.toString(),
      {
        ...options,
        method: options?.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      },
      res => {
        if (timeout) {
          return
        }
        res.setEncoding('utf8')
        res.on('data', chunk => (output += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(output))
          } catch (e) {
            logError('Unable to parse response:', output)
            reject(e)
          }
        })
      }
    )

    req.on('timeout', () => {
      timeout = true
      reject(new Error('Timeout'))
    })
    req.on('error', e => {
      if (!timeout) {
        reject(e)
      }
    })

    if (body !== undefined) {
      req.write(JSON.stringify(body))
    }

    req.end()
  })
}

export const postRequest = <T>(url: string | URL, body?: any, options?: Omit<RequestOptions, 'method'>) => {
  return httpRequest<T>(url, body, { ...options, method: 'POST' })
}

export const getRequest = <T>(url: string | URL, body?: any, options?: Omit<RequestOptions, 'method'>) => {
  return httpRequest<T>(url, body, { ...options, method: 'GET' })
}

export const isValidHttpUrl = (value: string) => {
  if (typeof value !== 'string') {
    return false
  }

  let url

  try {
    url = new URL(value.trim())
  } catch (_) {
    return false
  }

  return url.protocol === 'http:' || url.protocol === 'https:'
}
