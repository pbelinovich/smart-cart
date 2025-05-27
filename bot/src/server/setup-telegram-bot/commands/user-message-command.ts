import { buildCommand } from '../builder'
import { createSession, getSessionByTelegramId } from '../../external'
import { productsRequestCommand } from './products-request-command'
import { changeCityRequestCommand } from './change-city-request-command'
import { selectCityCommand } from './select-city-command'

export interface IUserMessageCommandParams {
  message: string
}

const MAX_MSG_LENGTH = 300

export const userMessageCommand = buildCommand(
  async ({ readExecutor, writeExecutor, tgUser, publicHttpApi, sendMessage, log }, params: IUserMessageCommandParams, commandRunner) => {
    try {
      log('USER MESSAGE')

      if (params.message.length > MAX_MSG_LENGTH) {
        return sendMessage('Слишком длинное сообщение. Сократи до 300 символов, пж')
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
        return commandRunner.runCommand(productsRequestCommand, { message: params.message })
      }

      if (session.state === 'creatingChangeCityRequest') {
        return commandRunner.runCommand(changeCityRequestCommand, { message: params.message })
      }

      if (session.state === 'choosingCity') {
        return commandRunner.runCommand(selectCityCommand, { message: params.message })
      }
    } catch (e) {
      log(e instanceof Error ? e.message : String(e))
      return sendMessage('Произошла ошибка при обработке вашего сообщения. Попробуй позже, пж')
    }
  }
)
