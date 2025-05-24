import { buildCommandHandler } from './common'
import { createSession, getSessionByTelegramId, removeSessions } from '../../../business-logic'

export const startCommand = buildCommandHandler(async ({ readExecutor, writeExecutor, telegramId, publicHttpApi, reply, log }) => {
  try {
    log(`START by ${telegramId}`)

    const [prevUser, prevSession] = await Promise.all([
      publicHttpApi.user.GET.byTelegramId({ telegramId }),
      readExecutor.execute(getSessionByTelegramId, { telegramId }),
    ])

    let user = prevUser

    if (!user) {
      user = await publicHttpApi.user.POST.create({ telegramId })
    }

    if (prevSession) {
      await writeExecutor.execute(removeSessions, { ids: [prevSession.id] })
    }

    await writeExecutor.execute(createSession, { userId: user.id, telegramId })

    return reply('Привет! Напиши список продуктов или выбери город через /city')
  } catch (e: any) {
    log(e.message)
    return reply('Произошла ошибка при регистрации. Попробуйте позже.')
  }
})
