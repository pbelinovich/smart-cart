import { IProductsRequestEntity, ProductsRequestStatus } from '@server'
import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { formatProductsRequest } from '../tools'

export interface IProductsRequestCommandParams {
  message: string
}

export const productsRequestCommand = buildCommand(
  async ({ readExecutor, tgUser, publicHttpApi, sendMessage, log, updateSession }, params: IProductsRequestCommandParams) => {
    const exceptionUnsubs: (() => Promise<void> | void)[] = []

    try {
      log(`PRODUCTS REQUEST → "${params.message}"`)

      const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

      if (!session || session.state !== 'idle') {
        return
      }

      exceptionUnsubs.push(() => updateSession({ id: session.id, state: 'idle' }))

      let prevProductsRequest: IProductsRequestEntity | undefined

      const sendProductsRequestUpdate = async (productsRequest: IProductsRequestEntity) => {
        if (prevProductsRequest?.status === productsRequest.status && prevProductsRequest.error === productsRequest.error) {
          return
        }

        prevProductsRequest = productsRequest

        const formatted = formatProductsRequest(productsRequest)

        if (formatted) {
          await sendMessage(formatted.message, formatted.options)
        }
      }

      const productsRequest = await publicHttpApi.productsRequest.POST.create({
        userId: session.userId,
        query: params.message,
      })

      await Promise.all([
        sendProductsRequestUpdate(productsRequest),
        updateSession({
          id: session.id,
          state: 'creatingProductsRequest',
          activeProductsRequestId: productsRequest.id,
        }),
      ])

      const productsRequestChannel = await publicHttpApi.productsRequest.CHANNEL.getById({
        id: productsRequest.id,
        userId: session.userId,
      })

      await sendProductsRequestUpdate(productsRequestChannel.getValue())

      let prev: IProductsRequestEntity | undefined

      const unsubFromProductsRequest = productsRequestChannel.subscribe(async next => {
        if (prev?.status === next.status && prev.error === next.error) {
          return
        }

        prev = next

        const statusesToUnsub: ProductsRequestStatus[] = ['productsCollected']
        const needUnsub = next.error || statusesToUnsub.includes(next.status)

        if (needUnsub) {
          unsubFromProductsRequest()
          await Promise.all([productsRequestChannel.destroy(), updateSession({ id: session.id, state: 'idle' })])
        }

        await sendProductsRequestUpdate(next)
      })

      exceptionUnsubs.push(unsubFromProductsRequest, productsRequestChannel.destroy)
    } catch (e) {
      await Promise.all(exceptionUnsubs.map(unsub => unsub()))
      log(e instanceof Error ? e.message : String(e))
      await sendMessage('Произошла ошибка при попытке получить список продуктов. Попробуй позже, пж')
    }
  }
)
