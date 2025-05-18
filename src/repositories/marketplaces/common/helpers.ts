import http from 'node:http'
import zlib from 'node:zlib'

export const isHttps = (url: string | URL) => {
  if (typeof url === 'string') {
    return url.startsWith('https:')
  }

  return url.protocol === 'https:'
}

export const decompressResponse = (res: http.IncomingMessage, data: Buffer): Promise<string> => {
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
