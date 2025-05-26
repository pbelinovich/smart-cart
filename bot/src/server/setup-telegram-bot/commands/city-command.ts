import { buildCommand } from '../builder'
import { createSession, getSessionByTelegramId, updateSession } from '../../external'

export const cityCommand = buildCommand(async ({ readExecutor, writeExecutor, tgUser, publicHttpApi, sendMessage, log }) => {
  try {
    log('CITY')

    const [prevUser, session] = await Promise.all([
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

    if (session) {
      await writeExecutor.execute(updateSession, { id: session.id, state: 'choosingCity' })
    } else {
      await writeExecutor.execute(createSession, { userId: user.id, telegramId: tgUser.id, state: 'choosingCity' })
    }

    return sendMessage(
      'Введи свой город в свободном формате. Я пришлю тебе список городов, которые я знаю, и ты сможешь выбрать один из них.'
    )
  } catch (e) {
    log(e instanceof Error ? e.message : String(e))
    return sendMessage('Произошла ошибка при выполнении команды /city. Пожалуйста, попробуйте позже.')
  }
})
