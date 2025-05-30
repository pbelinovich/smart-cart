import { IProductsRequestEntity, PriceCategory, ProductsRequestStatus } from '@server'
import { html } from 'teleform'
import { formatPrice } from './format-price'
import { chunkArray } from './chunk-array'
import { formatError } from './format-error'
import { MessageInfo } from '../message-manager'

type StatusToFormatterMap = {
  [key in ProductsRequestStatus]?: (productsRequest: IProductsRequestEntity) => MessageInfo | string
}

const priceCategoryEmoji: Record<PriceCategory, string> = {
  cheapest: '💸',
  popular: '🔥',
  mostExpensive: '💰',
}

const statusToFormatterMap: StatusToFormatterMap = {
  created: productsRequest => {
    if (productsRequest.error) {
      return formatError('Произошла ошибка во время создания запроса на сбор корзин')
    }

    return '☑️ Создал запрос на сбор корзин. Ожидай, бро'
  },
  productsParsing: productsRequest => {
    if (productsRequest.error) {
      return formatError('Произошла ошибка во время анализа твоего списка')
    }

    return { message: '🕓 Анализирую твой список...', options: { kind: 'edit' } }
  },
  productsParsed: productsRequest => {
    if (!productsRequest.aiProducts.length) {
      return { message: '🤖 Я не распознал ни одного товара', options: { kind: 'edit' } }
    }

    if (productsRequest.error) {
      return formatError('Произошла ошибка после того, как список был проанализирован')
    }

    const items = productsRequest.aiProducts.map(p => `• ${p.name} x${p.quantity} ${priceCategoryEmoji[p.priceCategory]}`).join('\n')

    return { message: [html.bold('🤖 Твой запрос:'), items].join('\n'), options: { kind: 'edit' } }
  },
  productsCollecting: productsRequest => {
    if (productsRequest.error) {
      return formatError('Произошла ошибка во время похода по магазинам')
    }

    return '🕓 Собираю корзины...'
  },
}

export const formatProductsRequest = (productsRequest: IProductsRequestEntity): MessageInfo | undefined => {
  const format = statusToFormatterMap[productsRequest.status]

  if (!format) {
    return
  }

  const result = format(productsRequest)

  return typeof result === 'string' ? { message: result } : result
}

export const formatCollectedProductsRequest = (productsRequest: IProductsRequestEntity): MessageInfo[] => {
  if (productsRequest.error) {
    return [{ message: formatError('Произошла ошибка после того, как корзины были собраны') }]
  }

  if (!productsRequest.carts.length) {
    return [{ message: '❌ Не получилось ничего найти' }]
  }

  const results = productsRequest.carts.map(cart => {
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
        ['• ', p.name, ' x', p.quantity, ' — ', html.bold(`${formatPrice(p.price)}₽`), ' ', priceCategoryEmoji[p.priceCategory]].join('')
      )
      .join('\n')

    const outOfStock = cart.productsAreOutOfStock.map(p => ['• ', p.name, ' x', p.quantity].join('')).join('\n')

    const stockBlock = ['🧾 ', html.bold('Найдено:'), '\n', inStock || html.italic('— Нет доступных товаров.')].join('')

    const outOfStockBlock = outOfStock ? ['\n\n❗️ ', html.bold('Нет в наличии:'), '\n', outOfStock].join('') : ''

    return [header, '\n\n', stockBlock, outOfStockBlock].join('')
  })

  const chunked = chunkArray(results)
  const prepared: MessageInfo[] = []

  chunked.forEach((chunk, index) => {
    prepared.push({ message: chunk.join('\n\n─\n\n'), options: index === 0 ? { kind: 'edit' } : undefined })
  })

  return prepared
}
