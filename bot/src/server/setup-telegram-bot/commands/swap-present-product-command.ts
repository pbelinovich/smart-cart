import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { getChoosePresentProductAction, getSwapPresentProductAction, getSwapProductAction } from '../common'
import { Markup } from 'telegraf'
import { InlineKeyboardButton } from '@telegraf/types'
import { updateSessionCommand } from './update-session-command'
import { formatMarketplaceProduct } from '../tools'

export interface ISwapPresentProductCommandParams {
  messageId: number
  cartId: string
  cartProductInStockIndex: number
  marketplaceProductIndex: number
}

export const swapPresentProductCommand = buildCommand({
  name: 'swapPresentProductCommand',
  handler: async (
    { readExecutor, tgUser, publicHttpApi, telegram },
    { messageId, cartId, cartProductInStockIndex, marketplaceProductIndex }: ISwapPresentProductCommandParams,
    { runCommand }
  ) => {
    let session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

    if (!session) {
      const nextSession = await runCommand(updateSessionCommand, { state: 'idle' })

      if (!nextSession) {
        return
      }

      session = nextSession
    }

    const cart = await publicHttpApi.cart.GET.byId({ id: cartId, userId: session.userId })

    if (!cart || !cart.productsInStock.data.length || !cart.productsInStock.data[cartProductInStockIndex]) {
      return telegram.editMessage(messageId, { message: '❌ Упс! Не смог найти корзину. Запроси список продуктов заново, пж' })
    }

    const productInStock = cart.productsInStock.data[cartProductInStockIndex]
    const presentProduct = await publicHttpApi.presentProduct.GET.byHash({ hash: productInStock.hash })

    if (!presentProduct || !presentProduct.marketplaceProducts.length || !presentProduct.marketplaceProducts[marketplaceProductIndex]) {
      return telegram.editMessage(messageId, { message: '❌ Упс! Не смог найти продукт. Запроси список продуктов заново, пж' })
    }

    const marketplaceProduct = presentProduct.marketplaceProducts[marketplaceProductIndex]
    const cartProductInStockHash = await publicHttpApi.cartProductInStockHash.POST.create({
      cartId,
      productHash: productInStock.hash,
      marketplaceId: marketplaceProduct.id,
    })

    const buttonsLines: InlineKeyboardButton[][] = []

    if (presentProduct.marketplaceProducts.length > 1) {
      const prevIndex = marketplaceProductIndex === 0 ? presentProduct.marketplaceProducts.length - 1 : marketplaceProductIndex - 1
      const nextIndex = marketplaceProductIndex === presentProduct.marketplaceProducts.length - 1 ? 0 : marketplaceProductIndex + 1

      buttonsLines.push([
        Markup.button.callback('⬅️ Предыдущий', getSwapPresentProductAction(cartId, cartProductInStockIndex, prevIndex)),
        Markup.button.callback('➡️ Следующий', getSwapPresentProductAction(cartId, cartProductInStockIndex, nextIndex)),
      ])
    }

    buttonsLines.push([
      Markup.button.callback('🔙 Назад', getSwapProductAction(cartId)),
      Markup.button.callback('✅ Выбрать', getChoosePresentProductAction(cartProductInStockHash.hash)),
    ])

    return telegram.editMessage(messageId, {
      message: formatMarketplaceProduct(marketplaceProduct),
      markup: Markup.inlineKeyboard(buttonsLines),
    })
  },
  errorHandler: async ({ telegram }, { messageId }) => {
    await telegram.editMessage(messageId, { message: 'Произошла ошибка при смене продукта. Попробуй позже, пж' })
  },
})
