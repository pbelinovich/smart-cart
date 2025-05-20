import { createHash } from 'node:crypto'
import { PriceCategory } from '../../external'

export const generateProductHash = (cityId: string, shopId: string, productName: string, productPriceCategory: PriceCategory) => {
  const hash = createHash('md5')
  hash.update(`${cityId}:${shopId}:${productName}:${productPriceCategory}`)
  return hash.digest('hex')
}
