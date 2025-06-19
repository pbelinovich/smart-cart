import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { CITY_COMMAND } from '../common'
import { formatCommand } from '../tools'
import { updateSessionCommand } from './update-session-command'

export const cancelCommand = buildCommand({
  name: 'cancelCommand',
  handler: async ({ readExecutor, tgUser, publicHttpApi, telegram }, _, { runCommand }) => {
    const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

    if (session) {
      if (session.state === 'idle') {
        return
      }

      if (session.state === 'creatingProductsRequest') {
        telegram.sendMessage({ message: '❌ Запрос на поиск продуктов отменен' })
      }

      if (session.state === 'creatingChangeCityRequest' || session.state === 'choosingCity' || session.state === 'confirmingCity') {
        if (session.activeChangeCityRequestId) {
          await publicHttpApi.changeCityRequest.POST.cancel({
            changeCityRequestId: session.activeChangeCityRequestId,
            userId: session.userId,
          })
        }

        telegram.sendMessage({ message: '❌ Выбор города отменен' })
      }
    }

    await runCommand(updateSessionCommand, { state: 'idle' })
  },
  errorHandler: ({ telegram }) => {
    telegram.sendMessage({
      message: `Произошла ошибка при выполнении команды ${formatCommand(CITY_COMMAND)}. Попробуйте позже, пж`,
    })
  },
})
