import { buildCommand } from '../builder'
import { createSession, getSessionByTelegramId, IUpdateSessionParams, updateSession } from '../../external'

export const updateSessionCommand = buildCommand(
  async ({ readExecutor, writeExecutor, tgUser, publicHttpApi, send, log }, params: Omit<IUpdateSessionParams, 'id'>) => {
    try {
      const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

      if (session) {
        return writeExecutor.execute(updateSession, { ...params, id: session.id })
      }

      let user = await publicHttpApi.user.GET.byTelegramId({ telegramId: tgUser.id })

      if (!user) {
        user = await publicHttpApi.user.POST.create({
          telegramId: tgUser.id,
          telegramLogin: tgUser.login,
          telegramFirstName: tgUser.firstName,
          telegramLastName: tgUser.lastName,
        })
      }

      return writeExecutor.execute(createSession, {
        ...params,
        userId: user.id,
        telegramId: tgUser.id,
      })
    } catch (e) {
      log(e instanceof Error ? e.message : String(e))
      send('Произошла ошибка при регистрации. Попробуйте позже.')
    }
  }
)
