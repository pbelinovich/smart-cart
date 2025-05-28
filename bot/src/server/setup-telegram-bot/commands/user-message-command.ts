import { buildCommand } from '../builder'
import { createSession, getSessionByTelegramId } from '../../external'
import { createProductsRequestCommand } from './create-products-request-command'
import { createChangeCityRequestCommand } from './create-change-city-request-command'

export interface IUserMessageCommandParams {
  message: string
}

const MAX_MSG_LENGTH = 300

export const userMessageCommand = buildCommand(
  async ({ readExecutor, writeExecutor, tgUser, publicHttpApi, send, log }, params: IUserMessageCommandParams, { runCommand }) => {
    try {
      log('USER MESSAGE')

      if (params.message.length > MAX_MSG_LENGTH) {
        return send('Слишком длинное сообщение. Сократи до 300 символов, пж')
      }

      let session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

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

        session = await writeExecutor.execute(createSession, {
          userId: user.id,
          telegramId: tgUser.id,
          state: 'idle',
        })
      }

      if (session.state === 'idle') {
        return runCommand(createProductsRequestCommand, { message: params.message })
      }

      if (session.state === 'creatingChangeCityRequest') {
        return runCommand(createChangeCityRequestCommand, { message: params.message })
      }
    } catch (e) {
      log(e instanceof Error ? e.message : String(e))
      return send('Произошла ошибка при обработке вашего сообщения. Попробуй позже, пж')
    }
  }
)
