import { buildCommand } from '../builder'
import { createSession, getSessionByTelegramId } from '../../external'
import { productsRequestCommand } from './products-request-command'

export interface IUserMessageCommandParams {
  message: string
}

const MAX_MSG_LENGTH = 300

export const userMessageCommand = buildCommand(
  async ({ readExecutor, writeExecutor, runCommand, tgUser, publicHttpApi, sendMessage, log }, params: IUserMessageCommandParams) => {
    try {
      log('USER MESSAGE')

      if (params.message.length > MAX_MSG_LENGTH) {
        return sendMessage('Слишком длинное сообщение. Пожалуйста, сократите до 300 символов.')
      }

      const [prevUser, prevSession] = await Promise.all([
        publicHttpApi.user.GET.byTelegramId({ telegramId: tgUser.id }),
        readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id }),
      ])

      let user = prevUser
      let session = prevSession

      if (!user) {
        user = await publicHttpApi.user.POST.create({
          telegramId: tgUser.id,
          telegramLogin: tgUser.login,
          telegramFirstName: tgUser.firstName,
          telegramLastName: tgUser.lastName,
        })
      }

      if (!session) {
        session = await writeExecutor.execute(createSession, { userId: user.id, telegramId: tgUser.id })
      }

      if (session.state === 'idle') {
        return runCommand(productsRequestCommand, { message: params.message })
      }

      if (session.state === 'choosingCity') {
      }

      if (session.state === 'confirmingCity') {
      }
    } catch (e) {
      log(e instanceof Error ? e.message : String(e))
      return sendMessage('Произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте позже.')
    }
  }
)
