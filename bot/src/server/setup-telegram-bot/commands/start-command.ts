import { buildCommand } from '../builder'
import { createSession, getSessionByTelegramId, removeSessions } from '../../external'

export const startCommand = buildCommand(async ({ readExecutor, writeExecutor, tgUser, publicHttpApi, sendMessage, log }) => {
  try {
    log('START')

    const [prevUser, prevSession] = await Promise.all([
      publicHttpApi.user.GET.byTelegramId({ telegramId: tgUser.id }),
      readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id }),
    ])

    let user = prevUser

    if (!user) {
      user = await publicHttpApi.user.POST.create({
        telegramId: tgUser.id,
        telegramLogin: tgUser.login,
        telegramFirstName: tgUser.firstName,
        telegramLastName: tgUser.lastName,
      })
    }

    if (prevSession) {
      await writeExecutor.execute(removeSessions, { ids: [prevSession.id] })
    }

    await writeExecutor.execute(createSession, { userId: user.id, telegramId: tgUser.id })

    return sendMessage('Привет! Напиши список продуктов или выбери город через /city')
  } catch (e) {
    log(e instanceof Error ? e.message : String(e))
    return sendMessage('Произошла ошибка при регистрации. Попробуйте позже.')
  }
})
