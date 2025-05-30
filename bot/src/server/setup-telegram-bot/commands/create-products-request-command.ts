import { IProductsRequestEntity, ProductsRequestStatus } from '@server'
import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { formatCollectedProductsRequest, formatProductsRequest } from '../tools'
import { updateSessionCommand } from './update-session-command'

export interface IProductsRequestCommandParams {
  message: string
}

export const createProductsRequestCommand = buildCommand(
  'createProductsRequestCommand',
  async ({ readExecutor, tgUser, publicHttpApi, send, sendBatch, log }, params: IProductsRequestCommandParams, { runCommand }) => {
    const exceptionUnsubs: (() => Promise<any> | void)[] = []

    try {
      log(`PRODUCTS REQUEST → "${params.message}"`)

      const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

      if (!session || session.state !== 'idle') {
        return
      }

      exceptionUnsubs.push(() => runCommand(updateSessionCommand, { state: 'idle' }))

      let prevProductsRequest: IProductsRequestEntity | undefined

      const sendProductsRequestUpdate = (productsRequest: IProductsRequestEntity) => {
        if (prevProductsRequest?.status === productsRequest.status && prevProductsRequest.error === productsRequest.error) {
          return
        }

        prevProductsRequest = productsRequest

        if (productsRequest.status === 'productsCollected') {
          return sendBatch(formatCollectedProductsRequest(productsRequest))
        }

        const formatted = formatProductsRequest(productsRequest)

        if (formatted) {
          send(formatted.message, formatted.options)
        }
      }

      const productsRequest = await publicHttpApi.productsRequest.POST.create({
        userId: session.userId,
        query: params.message,
      })

      sendProductsRequestUpdate(productsRequest)

      await runCommand(updateSessionCommand, {
        state: 'creatingProductsRequest',
        activeProductsRequestId: productsRequest.id,
      })

      const productsRequestChannel = await publicHttpApi.productsRequest.CHANNEL.getById({
        id: productsRequest.id,
        userId: session.userId,
      })

      sendProductsRequestUpdate(productsRequestChannel.getValue())

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
          await Promise.all([productsRequestChannel.destroy(), runCommand(updateSessionCommand, { state: 'idle' })])
        }

        sendProductsRequestUpdate(next)
      })

      exceptionUnsubs.push(unsubFromProductsRequest, productsRequestChannel.destroy)
    } catch (e) {
      await Promise.all(exceptionUnsubs.map(unsub => unsub()))
      log(e instanceof Error ? e.message : String(e))
      send('Произошла ошибка при попытке получить список продуктов. Попробуй позже, пж')
    }
  }
)
