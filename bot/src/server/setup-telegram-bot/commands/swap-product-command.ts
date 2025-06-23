import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { getShowCartAction, getSwapPresentProductAction } from '../common'
import { Markup } from 'telegraf'
import { InlineKeyboardButton } from '@telegraf/types'
import { updateSessionCommand } from './update-session-command'
import { chunkArray } from '../tools'

export interface ISwapProductCommandParams {
  messageId: number
  cartId: string
}

export const swapProductCommand = buildCommand({
  name: 'swapProductCommand',
  handler: async ({ readExecutor, tgUser, publicHttpApi, telegram }, params: ISwapProductCommandParams, { runCommand }) => {
    let session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

    if (!session) {
      const nextSession = await runCommand(updateSessionCommand, { state: 'idle' })

      if (!nextSession) {
        return
      }

      session = nextSession
    }

    const cart = await publicHttpApi.cart.GET.byId({ id: params.cartId, userId: session.userId })

    if (!cart) {
      return telegram.editMessage(params.messageId, { message: '❌ Упс! Не смог найти корзину. Запроси список продуктов заново, пж' })
    }

    if (!cart.productsInStock.data.length && !cart.productsAreOutOfStock.data.length) {
      return telegram.editMessage(params.messageId, {
        message: '❌ Упс! В корзине оказалось пусто. Запроси список продуктов заново, пж',
      })
    }

    const productsButtons: InlineKeyboardButton[] = []

    if (cart.productsInStock.data.length) {
      productsButtons.push(
        ...cart.productsInStock.data.map((product, index) =>
          Markup.button.callback(product.marketplaceName, getSwapPresentProductAction(cart.id, index, 0))
        )
      )
    }

    /* if (cart.productsAreOutOfStock.data.length) {
      productsButtons.push(
        ...cart.productsAreOutOfStock.data.map((product, index) =>
          Markup.button.callback(product.queryName, getSwapAbsentProductAction(cart.id, index))
        )
      )
    } */

    return telegram.editMessage(params.messageId, {
      // message: formatCart(cart) + html.bold('\n\n——\n\n⬇ Выбери продукт'),
      markup: Markup.inlineKeyboard([...chunkArray(productsButtons, 2), [Markup.button.callback('🔙 Назад', getShowCartAction(cart.id))]]),
    })
  },
  errorHandler: async ({ telegram }) => {
    await telegram.sendMessage({ message: 'Не удалось сменить продукт. Попробуй позже, пж' })
  },
})
