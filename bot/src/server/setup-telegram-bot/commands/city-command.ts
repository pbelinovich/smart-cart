import { buildCommand } from '../builder'
import { createSession, getSessionByTelegramId } from '../../external'
import { CITY_COMMAND } from '../common'
import { formatCommand } from '../tools'
import { cancelCommand } from './cancel-command'

export const cityCommand = buildCommand({
  name: 'cityCommand',
  handler: async ({ readExecutor, writeExecutor, tgUser, publicHttpApi, send }, _, { runCommand }) => {
    const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

    if (!session || session.state !== 'idle') {
      return runCommand(cancelCommand, {})
    }

    if (!session) {
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
        state: 'idle',
      })
    }

    const city = await publicHttpApi.city.GET.byTelegramId({ telegramId: tgUser.id })

    send(`🏙️ Твой текущий город: ${city.name}`)
  },
  errorHandler: ({ send }) => {
    send(`Произошла ошибка при выполнении команды ${formatCommand(CITY_COMMAND)}. Попробуйте позже, пж`)
  },
})
