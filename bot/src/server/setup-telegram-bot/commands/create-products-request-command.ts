import { pathGenerator } from '@shared'
import { ICartEntity, IProductsRequestEntity, ProductsRequestStatus } from '@server'
import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { formatProductsRequestError, formatProductsParsed } from '../tools'
import { updateSessionCommand } from './update-session-command'
import { formatCart } from '../tools/format-cart'
import { getSwapProductAction, ISendMessageParams } from '../common'
import { Markup } from 'telegraf'
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram'

export interface IProductsRequestCommandParams {
  message: string
}

const statusesToUnsub: ProductsRequestStatus[] = ['productsCollected']
const cartPath = pathGenerator<ICartEntity>()

export const createProductsRequestCommand = buildCommand({
  name: 'createProductsRequestCommand',
  handler: async (
    { readExecutor, chatId, tgUser, publicHttpApi, telegram, queueMaster, subscriptionManager },
    params: IProductsRequestCommandParams,
    { runCommand }
  ) => {
    const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

    if (!session || session.state !== 'idle') {
      return
    }

    let messageId: number | undefined

    const send = async (params: ISendMessageParams) => {
      messageId = await telegram.sendMessage(params)
    }

    const edit = (params: ISendMessageParams) => {
      if (messageId) {
        return telegram.editMessage(messageId, params)
      }

      return send(params)
    }

    const handleProductsRequestUpdate = (next: IProductsRequestEntity, prev?: IProductsRequestEntity) => {
      queueMaster.enqueue(async () => {
        if (prev?.status === next.status && prev.error === next.error) {
          return
        }

        if (next.error) {
          const message = formatProductsRequestError(next)

          if (messageId) {
            await telegram.editMessage(messageId, { message })
            return
          }

          await telegram.sendMessage({ message })
          return
        }

        if (next.status === 'created') {
          return send({ message: '☑️ Создал запрос на сбор корзин. Ожидай, бро' })
        }

        if (next.status === 'productsParsing') {
          return edit({ message: '🕓 Анализирую твой список...' })
        }

        if (next.status === 'productsParsed') {
          return edit({ message: formatProductsParsed(next) })
        }

        if (next.status === 'productsCollecting') {
          return edit({ message: '🕓 Собираю корзины...' })
        }

        if (next.status === 'productsCollected') {
          const cartsResponse = await publicHttpApi.cart.POST.getPage({
            filter: {
              data: { type: 'condition', field: cartPath('productsRequestId'), predicate: 'eq', value: next.id },
            },
            sort: [
              { field: cartPath('productsInStock', 'total'), direction: 'DESC', numeric: true },
              { field: cartPath('totalPrice'), direction: 'ASC', numeric: true },
            ],
            paging: {
              offset: 0,
              limit: 1,
            },
          })

          if (!cartsResponse.data.length) {
            return edit({ message: '❌ Не получилось ничего найти' })
          }

          let markup: Markup.Markup<InlineKeyboardMarkup> | undefined

          if (cartsResponse.total > 1) {
            markup = Markup.inlineKeyboard([
              [
                Markup.button.callback('⬅️ Предыдущий', getSwapProductAction(next.id, cartsResponse.total - 1)),
                Markup.button.callback('➡️ Следующий', getSwapProductAction(next.id, 1)),
              ],
            ])
          }

          return edit({ message: formatCart(cartsResponse.data[0], true), markup })
        }
      })
    }

    const productsRequest = await publicHttpApi.productsRequest.POST.create({
      userId: session.userId,
      query: params.message,
    })

    handleProductsRequestUpdate(productsRequest)

    const [channel] = await Promise.all([
      publicHttpApi.productsRequest.CHANNEL.getById({ id: productsRequest.id, userId: session.userId }),
      runCommand(updateSessionCommand, { state: 'creatingProductsRequest', activeProductsRequestId: productsRequest.id }),
    ])

    handleProductsRequestUpdate(channel.getValue(), productsRequest)

    subscriptionManager.add(chatId, {
      unsub: channel.subscribe(async (next, prev) => {
        if (next.error || statusesToUnsub.includes(next.status)) {
          await subscriptionManager.cleanup(chatId)
        }

        handleProductsRequestUpdate(next, prev)
      }),
      destroy: () => {
        return Promise.all([channel.destroy(), runCommand(updateSessionCommand, { state: 'idle' })])
      },
    })
  },
  errorHandler: ({ telegram }) => {
    telegram.sendMessage({ message: 'Произошла ошибка при попытке получить список продуктов. Попробуй позже, пж' })
  },
})
