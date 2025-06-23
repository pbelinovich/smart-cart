import { createHash } from 'node:crypto'
import { PriceCategory } from '../../external'

export const generateProductHash = (cityId: string, shopId: string, productName: string, productPriceCategory: PriceCategory) => {
  const hashInstance = createHash('md5')
  hashInstance.update(`${cityId.toLowerCase()}|${shopId.toLowerCase()}|${productName.toLowerCase()}|${productPriceCategory.toLowerCase()}`)
  return hashInstance.digest('base64')
}

export const generateCartProductInStockHash = (cartId: string, productHash: string, marketplaceId: string) => {
  const hashInstance = createHash('md5')
  hashInstance.update(`${cartId.toLowerCase()}|${productHash.toLowerCase()}|${marketplaceId.toLowerCase()}`)
  return hashInstance.digest('base64')
}
