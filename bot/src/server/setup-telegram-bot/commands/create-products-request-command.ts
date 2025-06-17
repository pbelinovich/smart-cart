import { pathGenerator } from '@shared'
import { ICartEntity, IProductsRequestEntity, ProductsRequestStatus } from '@server'
import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { ZERO_CARTS_LENGTH_ERROR, formatErrorProductsRequest, formatProductsRequest } from '../tools'
import { updateSessionCommand } from './update-session-command'
import { formatCart } from '../tools/format-cart'

export interface IProductsRequestCommandParams {
  message: string
}

const statusesToUnsub: ProductsRequestStatus[] = ['productsCollected']
const cartPath = pathGenerator<ICartEntity>()

export const createProductsRequestCommand = buildCommand({
  name: 'createProductsRequestCommand',
  handler: async (
    { readExecutor, chatId, tgUser, publicHttpApi, send, editLastOrSend, subscriptionManager },
    params: IProductsRequestCommandParams,
    { runCommand }
  ) => {
    const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

    if (!session || session.state !== 'idle') {
      return
    }

    const sendProductsRequestUpdate = async (next: IProductsRequestEntity, prev?: IProductsRequestEntity) => {
      if (prev?.status === next.status && prev.error === next.error) {
        return
      }

      const sendMessage = next.status === 'created' ? send : editLastOrSend

      if (next.error) {
        return sendMessage(formatErrorProductsRequest(next))
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
          return sendMessage(ZERO_CARTS_LENGTH_ERROR)
        }

        return sendMessage(formatCart(cartsResponse.data[0]))
      }

      const message = formatProductsRequest(next)

      if (message) {
        return sendMessage(message)
      }
    }

    const productsRequest = await publicHttpApi.productsRequest.POST.create({
      userId: session.userId,
      query: params.message,
    })

    await sendProductsRequestUpdate(productsRequest)

    const [channel] = await Promise.all([
      publicHttpApi.productsRequest.CHANNEL.getById({ id: productsRequest.id, userId: session.userId }),
      runCommand(updateSessionCommand, { state: 'creatingProductsRequest', activeProductsRequestId: productsRequest.id }),
    ])

    await sendProductsRequestUpdate(channel.getValue(), productsRequest)

    subscriptionManager.add(chatId, {
      unsub: channel.subscribe(async (next, prev) => {
        await sendProductsRequestUpdate(next, prev)

        if (next.error || statusesToUnsub.includes(next.status)) {
          return subscriptionManager.cleanup(chatId)
        }
      }),
      destroy: () => {
        return Promise.all([channel.destroy(), runCommand(updateSessionCommand, { state: 'idle' })])
      },
    })
  },
  errorHandler: ({ send }) => {
    send('Произошла ошибка при попытке получить список продуктов. Попробуй позже, пж')
  },
})
