import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { getShowCartAction, getSwapProductAction } from '../common'
import { formatCart } from '../tools/format-cart'
import { Markup } from 'telegraf'
import { InlineKeyboardButton } from '@telegraf/types'
import { pathGenerator } from '@shared'
import { ICartEntity } from '@server'
import { updateSessionCommand } from './update-session-command'

export interface IShowCartCommandParams {
  messageId: number
  cartId: string
}

const CARTS_LIMIT = 10

const cartPath = pathGenerator<ICartEntity>()

export const showCartCommand = buildCommand({
  name: 'showCartCommand',
  handler: async ({ readExecutor, tgUser, publicHttpApi, telegram }, params: IShowCartCommandParams, { runCommand }) => {
    let session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

    if (!session) {
      const nextSession = await runCommand(updateSessionCommand, { state: 'idle' })

      if (!nextSession) {
        return
      }

      session = nextSession
    }

    const entryCart = await publicHttpApi.cart.GET.byId({ id: params.cartId, userId: session.userId })

    if (!entryCart) {
      return telegram.editMessage(params.messageId, { message: '❌ Упс! Не смог найти корзину. Запроси список продуктов заново, пж' })
    }

    const cartsResponse = await publicHttpApi.cart.POST.getPage({
      filter: {
        data: { type: 'condition', field: cartPath('productsRequestId'), predicate: 'eq', value: entryCart.productsRequestId },
      },
      sort: [
        { field: cartPath('productsInStock', 'total'), direction: 'DESC', numeric: true },
        { field: cartPath('totalPrice'), direction: 'ASC', numeric: true },
      ],
      paging: {
        offset: 0,
        limit: CARTS_LIMIT,
      },
    })

    if (!cartsResponse.data.length) {
      return telegram.editMessage(params.messageId, { message: '❌ Не получилось ничего найти' })
    }

    const cartIndex = cartsResponse.data.findIndex(cart => cart.id === entryCart.id)
    const cart = cartsResponse.data[cartIndex]

    const buttonsLines: InlineKeyboardButton[][] = []

    if (cartsResponse.data.length > 1) {
      const prevIndex = cartIndex === 0 ? cartsResponse.data.length - 1 : cartIndex - 1
      const nextIndex = cartIndex === cartsResponse.data.length - 1 ? 0 : cartIndex + 1

      buttonsLines.push([
        Markup.button.callback('⬅️ Предыдущий', getShowCartAction(cartsResponse.data[prevIndex].id)),
        Markup.button.callback('➡️ Следующий', getShowCartAction(cartsResponse.data[nextIndex].id)),
      ])
    }

    buttonsLines.push([Markup.button.callback('🔄 Сменить продукт', getSwapProductAction(cart.id))])

    if (cartIndex > 0) {
      buttonsLines.push([Markup.button.callback('🤑 Показать самый выгодный', getShowCartAction(cartsResponse.data[0].id))])
    }

    return telegram.editMessage(params.messageId, {
      message: formatCart(cart, cartIndex === 0),
      markup: Markup.inlineKeyboard(buttonsLines),
    })
  },
  errorHandler: async ({ telegram }) => {
    await telegram.sendMessage({ message: 'Не удалось показать корзину. Попробуй позже, пж' })
  },
})
