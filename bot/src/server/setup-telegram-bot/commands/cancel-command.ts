import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { CITY_COMMAND } from '../common'
import { formatCommand } from '../tools'
import { updateSessionCommand } from './update-session-command'

export const cancelCommand = buildCommand(
  'cancelCommand',
  async ({ readExecutor, tgUser, publicHttpApi, send, log }, _, { runCommand }) => {
    try {
      log('CANCEL')

      const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

      if (session) {
        if (session.state === 'creatingProductsRequest') {
          return runCommand(updateSessionCommand, { state: 'idle' })
        }

        if (session.state === 'creatingChangeCityRequest') {
          await runCommand(updateSessionCommand, { state: 'idle' })
          return send('❌ Выбор города отменен')
        }

        if (session.state === 'choosingCity' || session.state === 'confirmingCity') {
          if (session.activeChangeCityRequestId) {
            await publicHttpApi.changeCityRequest.POST.cancel({
              changeCityRequestId: session.activeChangeCityRequestId,
              userId: session.userId,
            })
          }

          return runCommand(updateSessionCommand, { state: 'idle' })
        }
      }

      await runCommand(updateSessionCommand, { state: 'idle' })
      send('💁‍♂️ Нечего отменять, бро')
    } catch (e) {
      log(e instanceof Error ? e.message : String(e))
      send(`Произошла ошибка при выполнении команды ${formatCommand(CITY_COMMAND)}. Попробуйте позже, пж`)
    }
  }
)
