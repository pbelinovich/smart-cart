import { html } from 'teleform'
import { IMarketplaceProduct } from '@server'
import { formatPrice } from './format-price'

export const formatMarketplaceProduct = (marketplaceProduct: IMarketplaceProduct) => {
  return ['• ', marketplaceProduct.name, ' — ', html.bold(formatPrice(marketplaceProduct.price))].join('')
}
