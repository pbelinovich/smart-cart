import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { updateSessionCommand } from './update-session-command'
import { showCartCommand } from './show-cart-command'

export interface IChoosePresentProductCommandParams {
  messageId: number
  hash: string
}

export const choosePresentProductCommand = buildCommand({
  name: 'choosePresentProductCommand',
  handler: async ({ readExecutor, tgUser, publicHttpApi, telegram }, params: IChoosePresentProductCommandParams, { runCommand }) => {
    let session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

    if (!session) {
      const nextSession = await runCommand(updateSessionCommand, { state: 'idle' })

      if (!nextSession) {
        return
      }

      session = nextSession
    }

    const cartProductInStockHash = await publicHttpApi.cartProductInStockHash.GET.byHash({ hash: params.hash })

    if (!cartProductInStockHash) {
      return telegram.editMessage(params.messageId, { message: '❌ Упс! Не смог найти продукт. Запроси список продуктов заново, пж' })
    }

    const cart = await publicHttpApi.cart.POST.updateProductInStock({
      cartId: cartProductInStockHash.cartId,
      hash: cartProductInStockHash.productHash,
      marketplaceId: cartProductInStockHash.marketplaceId,
    })

    return runCommand(showCartCommand, { messageId: params.messageId, cartId: cart.id })
  },
  errorHandler: async ({ telegram }) => {
    await telegram.sendMessage({ message: 'Не удалось выбрать продукт. Попробуй позже, пж' })
  },
})
