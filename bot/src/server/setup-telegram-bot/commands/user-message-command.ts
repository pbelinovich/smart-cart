import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { createProductsRequestCommand } from './create-products-request-command'
import { createChangeCityRequestCommand } from './create-change-city-request-command'
import { cancelCommand } from './cancel-command'
import { updateSessionCommand } from './update-session-command'

export interface IUserMessageCommandParams {
  message: string
}

const MAX_MSG_LENGTH = 300

export const userMessageCommand = buildCommand({
  name: 'userMessageCommand',
  handler: async ({ readExecutor, tgUser, telegram }, params: IUserMessageCommandParams, { runCommand }) => {
    if (params.message.length > MAX_MSG_LENGTH) {
      return telegram.sendMessage({ message: 'Слишком длинное сообщение. Сократи до 300 символов, пж' })
    }

    let session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

    if (!session) {
      const nextSession = await runCommand(updateSessionCommand, { state: 'idle' })

      if (!nextSession) {
        return
      }

      session = nextSession
    }

    if (session.state === 'idle') {
      return runCommand(createProductsRequestCommand, { message: params.message })
    }

    if (session.state === 'creatingChangeCityRequest') {
      return runCommand(createChangeCityRequestCommand, { message: params.message })
    }

    if (session.state === 'choosingCity' || session.state === 'confirmingCity') {
      await runCommand(cancelCommand, {})
      return runCommand(createProductsRequestCommand, { message: params.message })
    }
  },
  errorHandler: async ({ telegram }) => {
    await telegram.sendMessage({ message: 'Произошла ошибка при обработке вашего сообщения. Попробуй позже, пж' })
  },
})
