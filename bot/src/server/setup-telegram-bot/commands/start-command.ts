import { html } from 'teleform'
import { buildCommand } from '../builder'
import { createSession, getSessionByTelegramId } from '../../external'
import { formatCommand, formatUser } from '../tools'
import { CITY_COMMAND } from '../common'
import { cancelCommand } from './cancel-command'

const cityCommand = formatCommand(CITY_COMMAND)

export const startCommand = buildCommand({
  name: 'startCommand',
  handler: async ({ readExecutor, writeExecutor, tgUser, publicHttpApi, telegram }, _, { runCommand }) => {
    const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

    if (session && session.state !== 'idle') {
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

        await writeExecutor.execute(createSession, {
          userId: user.id,
          telegramId: tgUser.id,
          state: 'idle',
        })

        const userName = formatUser(user)

        return telegram.sendMessage({
          message: `Привет${userName ? `, ${html.bold(userName)}` : ''}! Напиши список продуктов или выбери город через ${cityCommand}`,
        })
      }

      await writeExecutor.execute(createSession, {
        userId: user.id,
        telegramId: tgUser.id,
        state: 'idle',
      })
    }

    telegram.sendMessage({ message: `Ты уже зарегистрирован. Напиши список продуктов или выбери город через ${cityCommand}` })
  },
  errorHandler: ({ telegram }) => {
    telegram.sendMessage({ message: 'Произошла ошибка при регистрации. Попробуйте позже.' })
  },
})
