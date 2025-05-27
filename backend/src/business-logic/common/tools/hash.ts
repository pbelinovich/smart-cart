import { createHash } from 'node:crypto'
import { PriceCategory } from '../../external'

export const generateProductHash = (cityId: string, shopId: string, productName: string, productPriceCategory: PriceCategory) => {
  const hash = createHash('md5')
  hash.update(`${cityId.toLowerCase()}:${shopId.toLowerCase()}:${productName.toLowerCase()}:${productPriceCategory.toLowerCase()}`)
  return hash.digest('hex')
}
