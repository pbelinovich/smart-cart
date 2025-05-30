import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { updateSessionCommand } from './update-session-command'

export interface ISelectCityCommandParams {
  selectedCityId: string
}

export const selectCityCommand = buildCommand(
  'selectCityCommand',
  async ({ readExecutor, tgUser, publicHttpApi, send, log }, params: ISelectCityCommandParams, { runCommand }) => {
    const exceptionUnsubs: (() => Promise<any> | void)[] = []

    try {
      log(`SELECT CITY → "${params.selectedCityId}"`)

      const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

      if (!session || session.state !== 'choosingCity' || !session.activeChangeCityRequestId) {
        return
      }

      await runCommand(updateSessionCommand, { state: 'confirmingCity' })
      exceptionUnsubs.push(() => runCommand(updateSessionCommand, { state: 'idle' }))

      await publicHttpApi.changeCityRequest.POST.selectCity({
        changeCityRequestId: session.activeChangeCityRequestId,
        userId: session.userId,
        selectedCityId: params.selectedCityId,
      })

      await runCommand(updateSessionCommand, { state: 'idle' })
    } catch (e) {
      await Promise.all(exceptionUnsubs.map(unsub => unsub()))
      log(e instanceof Error ? e.message : String(e))
      send('Произошла ошибка при попытке получить список городов. Попробуй позже, пж')
    }
  }
)
