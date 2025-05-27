import { IProductsRequestEntity, PriceCategory, ProductsRequestStatus } from '@server'
import { html } from 'teleform'
import { formatPrice } from './format-price'
import { ISendMessageOptions } from '../common'

export interface IFormatProductsRequestResult {
  message: string
  options?: ISendMessageOptions
}

type StatusToFormatterMap = Record<
  ProductsRequestStatus,
  (productsRequest: IProductsRequestEntity) => IFormatProductsRequestResult | string
>

const priceCategoryEmoji: Record<PriceCategory, string> = {
  cheapest: '💸',
  popular: '🔥',
  mostExpensive: '💰',
}

const statusToFormatterMap: StatusToFormatterMap = {
  created: productsRequest => {
    if (productsRequest.error) {
      return 'Упс! Произошла ошибка во время создания запроса на сбор корзин. Повтори попытку, пж'
    }

    return '☑️ Создал запрос на сбор корзин. Ожидай, бро'
  },
  productsParsing: productsRequest => {
    if (productsRequest.error) {
      return 'Упс! Произошла ошибка во время анализа твоего списка. Повтори попытку, пж'
    }

    return '🕓 Анализирую твой список...'
  },
  productsParsed: productsRequest => {
    if (!productsRequest.aiProducts.length) {
      return '🤖 Я не распознал ни одного товара'
    }

    if (productsRequest.error) {
      return 'Упс! Произошла ошибка после того, как список был проанализирован. Повтори попытку, пж'
    }

    const items = productsRequest.aiProducts.map(p => `• ${p.name} x${p.quantity} ${priceCategoryEmoji[p.priceCategory]}`).join('\n')

    return [html.bold('🤖 Твой запрос:'), items].join('\n')
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
      results.push('❌ Не получилось ничего найти')
    }

    return results.join('\n\n─\n\n')
  },
}

export const formatProductsRequest = (productsRequest: IProductsRequestEntity): IFormatProductsRequestResult | undefined => {
  const format = statusToFormatterMap[productsRequest.status]

  if (!format) {
    return
  }

  const result = format(productsRequest)

  return typeof result === 'string' ? { message: result } : result
}
