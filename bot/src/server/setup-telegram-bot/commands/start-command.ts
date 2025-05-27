import { html } from 'teleform'
import { buildCommand } from '../builder'
import { createSession, getSessionByTelegramId, SessionState, updateSession } from '../../external'
import { formatCommand, formatUser } from '../tools'
import { CITY_COMMAND } from '../common'

export const startCommand = buildCommand(async ({ readExecutor, writeExecutor, tgUser, publicHttpApi, sendMessage, log }) => {
  try {
    log('START')

    const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })
    const cityCommand = formatCommand(CITY_COMMAND)

    if (session) {
      const statusesToCancel: SessionState[] = ['creatingChangeCityRequest', 'choosingCity', 'confirmingCity']

      if (statusesToCancel.includes(session.state) && session.activeChangeCityRequestId) {
        await publicHttpApi.changeCityRequest.POST.cancel({
          changeCityRequestId: session.activeChangeCityRequestId,
          userId: session.userId,
        })
      }

      await writeExecutor.execute(updateSession, { id: session.id, state: 'idle' })
    } else {
      let user = await publicHttpApi.user.GET.byTelegramId({ telegramId: tgUser.id })

      if (!user) {
        user = await publicHttpApi.user.POST.create({
          telegramId: tgUser.id,
          telegramLogin: tgUser.login,
          telegramFirstName: tgUser.firstName,
          telegramLastName: tgUser.lastName,
        })

        await writeExecutor.execute(createSession, {
          userId: user.id,
          telegramId: tgUser.id,
          state: 'idle',
        })

        const userName = formatUser(user)

        return sendMessage(
          `Привет${userName ? `, ${html.bold(userName)}` : ''}! Напиши список продуктов или выбери город через ${cityCommand}`
        )
      }

      await writeExecutor.execute(createSession, {
        userId: user.id,
        telegramId: tgUser.id,
        state: 'idle',
      })
    }

    return sendMessage(`Ты уже зарегистрирован. Напиши список продуктов или выбери город через ${cityCommand}`)
  } catch (e) {
    log(e instanceof Error ? e.message : String(e))
    return sendMessage('Произошла ошибка при регистрации. Попробуйте позже.')
  }
})
