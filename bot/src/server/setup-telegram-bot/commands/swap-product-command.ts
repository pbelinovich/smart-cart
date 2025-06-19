import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { CITY_COMMAND, getSwapProductAction } from '../common'
import { formatCommand } from '../tools'
import { formatCart } from '../tools/format-cart'
import { Markup } from 'telegraf'
import { InlineKeyboardMarkup } from '@telegraf/types'
import { pathGenerator } from '@shared'
import { ICartEntity } from '@server'

export interface ISwapProductCommandParams {
  messageId: number
  productsRequestId: string
  offset: number
}

const cartPath = pathGenerator<ICartEntity>()

export const swapProductCommand = buildCommand({
  name: 'swapProductCommand',
  handler: async ({ readExecutor, tgUser, publicHttpApi, telegram }, params: ISwapProductCommandParams) => {
    const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

    if (!session || session.state !== 'idle') {
      return
    }

    // await telegram.clearMessageReplyMarkup(params.messageId)

    const cartsResponse = await publicHttpApi.cart.POST.getPage({
      filter: {
        data: { type: 'condition', field: cartPath('productsRequestId'), predicate: 'eq', value: params.productsRequestId },
      },
      sort: [
        { field: cartPath('productsInStock', 'total'), direction: 'DESC', numeric: true },
        { field: cartPath('totalPrice'), direction: 'ASC', numeric: true },
      ],
      paging: {
        offset: params.offset,
        limit: 1,
      },
    })

    if (!cartsResponse.data.length) {
      return
    }

    let markup: Markup.Markup<InlineKeyboardMarkup> | undefined

    if (cartsResponse.total > 1) {
      const prevOffset = params.offset === 0 ? cartsResponse.total - 1 : params.offset - 1
      const nextOffset = params.offset === cartsResponse.total - 1 ? 0 : params.offset + 1

      const buttons = [
        [
          Markup.button.callback('⬅️ Предыдущий', getSwapProductAction(params.productsRequestId, prevOffset)),
          Markup.button.callback('➡️ Следующий', getSwapProductAction(params.productsRequestId, nextOffset)),
        ],
      ]

      if (params.offset > 0) {
        buttons.push([Markup.button.callback('🤑 Показать самый выгодный', getSwapProductAction(params.productsRequestId, 0))])
      }

      markup = Markup.inlineKeyboard(buttons)
    }

    return telegram.editMessage(params.messageId, { message: formatCart(cartsResponse.data[0], params.offset === 0), markup })
  },
  errorHandler: ({ telegram }) => {
    telegram.sendMessage({
      message: `Произошла ошибка при выполнении команды ${formatCommand(CITY_COMMAND)}. Попробуйте позже, пж`,
    })
  },
})
