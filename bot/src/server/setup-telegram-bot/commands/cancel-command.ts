import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { CITY_COMMAND } from '../common'
import { formatCommand } from '../tools'
import { updateSessionCommand } from './update-session-command'

export const cancelCommand = buildCommand({
  name: 'cancelCommand',
  handler: async ({ readExecutor, tgUser, publicHttpApi, send }, _, { runCommand }) => {
    const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

    if (session) {
      if (session.state === 'idle') {
        return
      }

      if (session.state === 'creatingProductsRequest') {
        send('❌ Запрос на поиск продуктов отменен')
      }

      if (session.state === 'creatingChangeCityRequest' || session.state === 'choosingCity' || session.state === 'confirmingCity') {
        if (session.activeChangeCityRequestId) {
          await publicHttpApi.changeCityRequest.POST.cancel({
            changeCityRequestId: session.activeChangeCityRequestId,
            userId: session.userId,
          })
        }

        send('❌ Выбор города отменен')
      }
    }

    await runCommand(updateSessionCommand, { state: 'idle' })
  },
  errorHandler: ({ send }) => {
    send(`Произошла ошибка при выполнении команды ${formatCommand(CITY_COMMAND)}. Попробуйте позже, пж`)
  },
})
