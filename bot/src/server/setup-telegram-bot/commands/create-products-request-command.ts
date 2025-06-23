import { ICartEntity, IProductsRequestEntity, ProductsRequestStatus } from '@server'
import { buildCommand } from '../builder'
import { getSessionByTelegramId, logError } from '../../external'
import { formatProductsRequestError, formatProductsParsed } from '../tools'
import { updateSessionCommand } from './update-session-command'
import { ISendMessageParams } from '../common'
import { showCartCommand } from './show-cart-command'
import { pathGenerator } from '@shared'

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
        try {
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
            return send({ message: '🕓 Собираю корзины...' })
          }

          if (next.status === 'productsCollected') {
            if (!messageId) {
              return
            }

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
              return telegram.editMessage(messageId, { message: '❌ Не получилось найти собранную корзину. Попробуй запросить заново, пж' })
            }

            return runCommand(showCartCommand, { messageId, cartId: cartsResponse.data[0].id })
          }
        } catch (e) {
          logError(e)
          await telegram.sendMessage({ message: 'Произошла ошибка при попытке получить список продуктов. Попробуй позже, пж' })
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
  errorHandler: async ({ telegram }) => {
    await telegram.sendMessage({ message: 'Произошла ошибка при попытке получить список продуктов. Попробуй позже, пж' })
  },
})
