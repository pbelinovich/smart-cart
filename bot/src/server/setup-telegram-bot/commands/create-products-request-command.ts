import { IProductsRequestEntity, ProductsRequestStatus } from '@server'
import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { formatCollectedProductsRequest, formatProductsRequest } from '../tools'
import { updateSessionCommand } from './update-session-command'

export interface IProductsRequestCommandParams {
  message: string
}

const statusesToUnsub: ProductsRequestStatus[] = ['productsCollected']

export const createProductsRequestCommand = buildCommand({
  name: 'createProductsRequestCommand',
  handler: async (
    { readExecutor, chatId, tgUser, publicHttpApi, send, sendBatch, subscriptionManager },
    params: IProductsRequestCommandParams,
    { runCommand }
  ) => {
    const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

    if (!session || session.state !== 'idle') {
      return
    }

    const sendProductsRequestUpdate = (next: IProductsRequestEntity, prev?: IProductsRequestEntity) => {
      if (prev?.status === next.status && prev.error === next.error) {
        return
      }

      if (next.status === 'productsCollected') {
        return sendBatch(formatCollectedProductsRequest(next))
      }

      const formatted = formatProductsRequest(next)

      if (formatted) {
        send(formatted.message, formatted.options)
      }
    }

    const productsRequest = await publicHttpApi.productsRequest.POST.create({
      userId: session.userId,
      query: params.message,
    })

    sendProductsRequestUpdate(productsRequest)

    const [channel] = await Promise.all([
      publicHttpApi.productsRequest.CHANNEL.getById({ id: productsRequest.id, userId: session.userId }),
      runCommand(updateSessionCommand, { state: 'creatingProductsRequest', activeProductsRequestId: productsRequest.id }),
    ])

    sendProductsRequestUpdate(channel.getValue(), productsRequest)

    subscriptionManager.add(chatId, {
      unsub: channel.subscribe((next, prev) => {
        sendProductsRequestUpdate(next, prev)

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
