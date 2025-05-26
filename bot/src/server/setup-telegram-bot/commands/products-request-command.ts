import { IProductsRequestEntity } from '@server'
import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { formatProductsRequest } from '../tools'

export interface IProductsRequestCommandParams {
  message: string
}

export const productsRequestCommand = buildCommand(
  async ({ readExecutor, tgUser, publicHttpApi, sendMessage, log }, params: IProductsRequestCommandParams) => {
    const unsubs: (() => Promise<void> | void)[] = []

    try {
      log(`PRODUCTS REQUEST → "${params.message}"`)

      const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

      if (!session || session.state !== 'idle') {
        return
      }

      let prevProductsRequest: IProductsRequestEntity | undefined

      const sendProductsRequestUpdate = async (productsRequest: IProductsRequestEntity) => {
        if (!prevProductsRequest || prevProductsRequest.status !== productsRequest.status || productsRequest.error) {
          prevProductsRequest = productsRequest
          await sendMessage(formatProductsRequest(productsRequest))
        }
      }

      const productsRequest = await publicHttpApi.productsRequest.POST.create({
        userId: session.userId,
        query: params.message,
      })

      await sendProductsRequestUpdate(productsRequest)

      const productsRequestChannel = await publicHttpApi.productsRequest.CHANNEL.getById({
        userId: session.userId,
        id: productsRequest.id,
      })

      await sendProductsRequestUpdate(productsRequestChannel.getValue())

      const unsubFromProductsRequest = productsRequestChannel.subscribe(async nextProductsRequest => {
        await sendProductsRequestUpdate(nextProductsRequest)

        if (nextProductsRequest.error || nextProductsRequest.status === 'productsCollected') {
          unsubFromProductsRequest()
          await productsRequestChannel.destroy()
        }
      })

      unsubs.push(unsubFromProductsRequest, productsRequestChannel.destroy)
    } catch (e) {
      await Promise.all(unsubs.map(unsub => unsub()))
      log(e instanceof Error ? e.message : String(e))
      await sendMessage('Произошла ошибка при попытке получить список продуктов. Попробуйте позже.')
    }
  }
)
