import { IProductsRequestEntity, PriceCategory, ProductsRequestStatus } from '@server'
import { html } from 'teleform'
import { formatError } from './format-error'

type StatusToFormatterMap = {
  [key in ProductsRequestStatus]: ((productsRequest: IProductsRequestEntity) => string) | string
}

const priceCategoryEmoji: Record<PriceCategory, string> = {
  cheapest: '💸',
  popular: '🔥',
  mostExpensive: '💰',
}

const errorStatusToFormatterMap: StatusToFormatterMap = {
  created: 'Произошла ошибка во время создания запроса на сбор корзин',
  productsParsing: 'Произошла ошибка во время анализа твоего списка',
  productsParsed: 'Произошла ошибка после того, как список был проанализирован',
  productsCollecting: 'Произошла ошибка во время похода по магазинам',
  productsCollected: 'Произошла ошибка после того, как корзины были собраны',
}

export const formatProductsParsed = (productsRequest: IProductsRequestEntity) => {
  if (!productsRequest.aiProducts.length) {
    return '🤖 Я не распознал ни одного товара'
  }

  const items = productsRequest.aiProducts.map(p => `• ${p.name} x${p.quantity} ${priceCategoryEmoji[p.priceCategory]}`).join('\n')

  return [html.bold('🤖 Твой запрос:'), items].join('\n')
}

export const formatProductsRequestError = (productsRequest: IProductsRequestEntity) => {
  const formatter = errorStatusToFormatterMap[productsRequest.status]
  return formatError(typeof formatter === 'function' ? formatter(productsRequest) : formatter)
}
