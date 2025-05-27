import { buildCommand } from '../builder'
import { createSession, getSessionByTelegramId, SessionState, updateSession } from '../../external'
import { CITY_COMMAND } from '../common'
import { formatCommand } from '../tools'

export const cityCommand = buildCommand(async ({ readExecutor, writeExecutor, tgUser, publicHttpApi, sendMessage, log }) => {
  try {
    log('CITY')

    const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

    if (session) {
      const statusesToCancel: SessionState[] = ['creatingChangeCityRequest', 'choosingCity', 'confirmingCity']

      if (statusesToCancel.includes(session.state) && session.activeChangeCityRequestId) {
        await publicHttpApi.changeCityRequest.POST.cancel({
          changeCityRequestId: session.activeChangeCityRequestId,
          userId: session.userId,
        })
      }

      await writeExecutor.execute(updateSession, { id: session.id, state: 'creatingChangeCityRequest' })
    } else {
      let user = await publicHttpApi.user.GET.byTelegramId({ telegramId: tgUser.id })

      if (!user) {
        user = await publicHttpApi.user.POST.create({
          telegramId: tgUser.id,
          telegramLogin: tgUser.login,
          telegramFirstName: tgUser.firstName,
          telegramLastName: tgUser.lastName,
        })
      }

      await writeExecutor.execute(createSession, {
        userId: user.id,
        telegramId: tgUser.id,
        state: 'creatingChangeCityRequest',
      })
    }

    return sendMessage('⬇ Введи свой город в свободном формате, я поищу')
  } catch (e) {
    log(e instanceof Error ? e.message : String(e))
    return sendMessage(`Произошла ошибка при выполнении команды ${formatCommand(CITY_COMMAND)}. Попробуйте позже, пж`)
  }
})
