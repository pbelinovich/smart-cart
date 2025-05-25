import { buildCommandHandler } from '../common'
import { createSession, getSessionByTelegramId } from '../../../external'
import { formatProductsRequest } from './format-products-request'
import isEqual from 'react-fast-compare'

export interface IUserMessageCommandParams {
  message: string
}

export const userMessageCommand = buildCommandHandler(
  async ({ readExecutor, writeExecutor, telegramId, publicHttpApi, sendMessage, log }, params: IUserMessageCommandParams) => {
    const unsubs: (() => Promise<void> | void)[] = []

    try {
      log(`USER MESSAGE by ${telegramId}`)

      const [prevUser, prevSession] = await Promise.all([
        publicHttpApi.user.GET.byTelegramId({ telegramId }),
        readExecutor.execute(getSessionByTelegramId, { telegramId }),
      ])

      let user = prevUser
      let session = prevSession

      if (!user) {
        user = await publicHttpApi.user.POST.create({ telegramId })
      }

      if (!session) {
        session = await writeExecutor.execute(createSession, { userId: user.id, telegramId })
      }

      if (session.state === 'idle') {
        const productsRequest = await publicHttpApi.productsRequest.POST.create({
          userId: user.id,
          query: params.message,
        })

        await sendMessage(formatProductsRequest(productsRequest))

        const productsRequestChannel = await publicHttpApi.productsRequest.CHANNEL.getById({
          userId: user.id,
          id: productsRequest.id,
        })

        const nextProductsRequest = productsRequestChannel.getValue()

        if (!isEqual(productsRequest, nextProductsRequest)) {
          await sendMessage(formatProductsRequest(productsRequestChannel.getValue()))
        }

        const unsubFromProductsRequest = productsRequestChannel.subscribe(async productsRequest => {
          await sendMessage(formatProductsRequest(productsRequest))

          if (productsRequest.error || productsRequest.status === 'productsCollected') {
            unsubFromProductsRequest()
            await productsRequestChannel.destroy()
          }
        })

        unsubs.push(unsubFromProductsRequest, productsRequestChannel.destroy)
      }
    } catch (e: any) {
      await Promise.all(unsubs.map(unsub => unsub()))
      log(e.message)
      await sendMessage('Произошла ошибка при попытке получить список продуктов. Попробуйте позже.')
    }
  }
)
