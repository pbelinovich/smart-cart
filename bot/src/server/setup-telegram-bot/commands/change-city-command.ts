import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { CITY_COMMAND } from '../common'
import { formatCommand } from '../tools'
import { updateSessionCommand } from './update-session-command'
import { cancelCommand } from './cancel-command'

export const changeCityCommand = buildCommand({
  name: 'changeCityCommand',
  handler: async ({ readExecutor, tgUser, telegram }, _, { runCommand }) => {
    const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

    if (!session || session.state !== 'idle') {
      return runCommand(cancelCommand, {})
    }

    await runCommand(updateSessionCommand, { state: 'creatingChangeCityRequest' })
    telegram.sendMessage({ message: '⬇ Введи свой город в свободном формате, я поищу' })
  },
  errorHandler: ({ telegram }) => {
    telegram.sendMessage({
      message: `Произошла ошибка при выполнении команды ${formatCommand(CITY_COMMAND)}. Попробуйте позже, пж`,
    })
  },
})
