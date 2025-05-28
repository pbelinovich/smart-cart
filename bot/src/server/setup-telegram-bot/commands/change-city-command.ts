import { buildCommand } from '../builder'
import { getSessionByTelegramId, SessionState } from '../../external'
import { CITY_COMMAND } from '../common'
import { formatCommand } from '../tools'
import { updateSessionCommand } from './update-session-command'

export const changeCityCommand = buildCommand(async ({ readExecutor, tgUser, send, log }, _, { runCommand }) => {
  try {
    log('CITY')

    const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })
    const cancelStates: SessionState[] = ['creatingChangeCityRequest', 'choosingCity', 'confirmingCity']

    await runCommand(updateSessionCommand, {
      state: session && cancelStates.includes(session.state) ? 'idle' : 'creatingChangeCityRequest',
    })

    send('⬇ Введи свой город в свободном формате, я поищу')
  } catch (e) {
    log(e instanceof Error ? e.message : String(e))
    send(`Произошла ошибка при выполнении команды ${formatCommand(CITY_COMMAND)}. Попробуйте позже, пж`)
  }
})
