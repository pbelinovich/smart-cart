import { html } from 'teleform'
import { ICartEntity, PriceCategory } from '@server'
import { formatPrice } from './format-price'

const priceCategoryEmoji: Record<PriceCategory, string> = {
  cheapest: '💸',
  popular: '🔥',
  mostExpensive: '💰',
}

export const formatCart = (cart: ICartEntity) => {
  const header = ['🛒 ', html.bold(cart.shopName), '\n💵 ', html.italic('Итого:'), ' ', html.bold(formatPrice(cart.totalPrice))].join('')
  const inStock = cart.productsInStock.data
    .map(p =>
      [
        '• ',
        p.marketplaceName,
        ' x',
        p.quantity,
        ' — ',
        html.bold(formatPrice(p.marketplacePrice)),
        ' ',
        priceCategoryEmoji[p.priceCategory],
      ].join('')
    )
    .join('\n')

  const outOfStock = cart.productsAreOutOfStock.data.map(p => ['• ', p.queryName, ' x', p.quantity].join('')).join('\n')
  const stockBlock = ['🧾 ', html.bold('Найдено:'), '\n', inStock || html.italic('— Нет доступных товаров.')].join('')
  const outOfStockBlock = outOfStock ? ['\n\n❗️ ', html.bold('Нет в наличии:'), '\n', outOfStock].join('') : ''

  return [header, '\n\n', stockBlock, outOfStockBlock].join('')
}
