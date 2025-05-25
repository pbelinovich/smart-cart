import { IProductsRequestEntity, PriceCategory, ProductsRequestStatus } from '@server'
import { html } from 'teleform'
import { formatPrice } from '../../tools'

const priceCategoryEmoji: Record<PriceCategory, string> = {
  cheapest: '💸',
  popular: '🔥',
  mostExpensive: '💰',
}

const statusToFormatterMap: Record<ProductsRequestStatus, (productsRequest: IProductsRequestEntity) => string> = {
  created: productsRequest => {
    if (productsRequest.error) {
      return 'Упс! Произошла ошибка во время создания запроса. Повтори попытку, пж'
    }

    return '⬇️ Создал запрос на сбор корзин. Ожидай, бро'
  },
  productsParsing: productsRequest => {
    if (productsRequest.error) {
      return 'Упс! Произошла ошибка во время анализа твоего списка. Повтори попытку, пж'
    }

    return '🕓 Анализирую твой список...'
  },
  productsParsed: productsRequest => {
    if (productsRequest.error) {
      return 'Упс! Произошла ошибка после того, как список был проанализирован. Повтори попытку, пж'
    }

    if (!productsRequest.aiProducts.length) {
      return html.bold('🤖 Нейросеть не распознала ни одного товара.')
    }

    const items = productsRequest.aiProducts.map(p => `• ${p.name} x${p.quantity} ${priceCategoryEmoji[p.priceCategory]}`).join('\n')

    return [html.bold('🤖 Распознанные товары:'), items].join('\n')
  },
  productsCollecting: productsRequest => {
    if (productsRequest.error) {
      return 'Упс! Произошла ошибка во время похода по магазинам. Повтори попытку, пж'
    }

    return '🕓 Собираю корзины...'
  },
  productsCollected: productsRequest => {
    if (productsRequest.error) {
      return 'Упс! Произошла ошибка после того, как корзины были собраны. Повтори попытку, пж'
    }

    const results: string[] = []

    if (productsRequest.carts.length) {
      results.push(
        ...productsRequest.carts.map(cart => {
          const header = [
            '🛒 ',
            html.bold(cart.shopName),
            '\n💵 ',
            html.italic('Итого:'),
            ' ',
            html.bold(`${formatPrice(cart.totalPrice)}₽`),
          ].join('')

          const inStock = cart.productsInStock
            .map(p =>
              ['• ', p.name, ' x', p.quantity, ' — ', html.bold(`${formatPrice(p.price)}₽`), ' ', priceCategoryEmoji[p.priceCategory]].join(
                ''
              )
            )
            .join('\n')

          const outOfStock = cart.productsAreOutOfStock.map(p => ['• ', p.name, ' x', p.quantity].join('')).join('\n')

          const stockBlock = ['🧾 ', html.bold('Найдено:'), '\n', inStock || html.italic('— Нет доступных товаров.')].join('')

          const outOfStockBlock = outOfStock ? ['\n\n❗️ ', html.bold('Нет в наличии:'), '\n', outOfStock].join('') : ''

          return [header, '\n\n', stockBlock, outOfStockBlock].join('')
        })
      )
    } else {
      results.push('❌ Не получилось ничего найти.')
    }

    return results.join('\n\n─\n\n')
  },
}

export const formatProductsRequest = (productsRequest: IProductsRequestEntity): string => {
  const format = statusToFormatterMap[productsRequest.status]
  return format ? format(productsRequest) : ''
}
