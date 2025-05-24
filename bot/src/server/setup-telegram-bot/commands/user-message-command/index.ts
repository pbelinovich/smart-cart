import { buildCommandHandler } from '../common'
import { createSession, getSessionByTelegramId } from '../../../external'
import { formatProductsRequest } from './format-products-request'

export interface IUserMessageCommandParams {
  message: string
}

export const userMessageCommand = buildCommandHandler(
  async ({ readExecutor, writeExecutor, telegramId, publicHttpApi, reply, log }, params: IUserMessageCommandParams) => {
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
        const productsRequestId = await publicHttpApi.productsRequest.POST.create({
          userId: user.id,
          query: params.message,
        })

        const productsRequestChannel = await publicHttpApi.productsRequest.CHANNEL.getById({
          userId: user.id,
          id: productsRequestId,
        })

        unsubs.push(
          productsRequestChannel.destroy,
          productsRequestChannel.subscribe(productsRequest => {
            reply(formatProductsRequest(productsRequest))
          })
        )
      }

      await reply('Привет! Напиши список продуктов или выбери город через /city')
    } catch (e: any) {
      log(e.message)
      await reply('Произошла ошибка при попытке получить список продуктов. Попробуйте позже.')
    }

    await Promise.all(unsubs.map(unsub => unsub()))
  }
)
