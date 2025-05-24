import { IProductsRequestEntity, PriceCategory, ProductsRequestStatus } from '@server'

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

    return '⬇️ Проанализировал сообщение'
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

    if (!productsRequest.carts.length) return '❌ Не получилось ничего найти\\.'

    return productsRequest.carts
      .map(cart => {
        const header = `🛒 *${cart.shopName}*\n💵 _Итого_: *${cart.totalPrice.toFixed(2)}₽*`

        const inStockList = cart.productsInStock.length
          ? cart.productsInStock
              .map(p => `• ${p.name} x${p.quantity} — *${p.price.toFixed(2)}₽* ${priceCategoryEmoji[p.priceCategory]}`)
              .join('\n')
          : '— Нет доступных товаров\\.'

        const outOfStockList = cart.productsAreOutOfStock.length
          ? cart.productsAreOutOfStock
              .map(p => `• ${p.name} x${p.quantity} — _Нет в наличии_ ${priceCategoryEmoji[p.priceCategory]}`)
              .join('\n')
          : ''

        const outOfStockBlock = outOfStockList ? `\n\n❗️ *Нет в наличии:*\n${outOfStockList}` : ''

        return `${header}\n\n🧾 *Найдено:*\n${inStockList}${outOfStockBlock}`
      })
      .join('\n\n────────────\n\n')
  },
}

export const formatProductsRequest = (productsRequest: IProductsRequestEntity): string => {
  const format = statusToFormatterMap[productsRequest.status]
  return format ? format(productsRequest) : ''
}
