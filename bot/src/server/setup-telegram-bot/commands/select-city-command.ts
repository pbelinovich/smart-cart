import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'

export interface ISelectCityCommandParams {
  message: string
}

export const selectCityCommand = buildCommand(
  async ({ readExecutor, tgUser, publicHttpApi, sendMessage, log, updateSession }, params: ISelectCityCommandParams) => {
    const exceptionUnsubs: (() => Promise<void> | void)[] = []

    try {
      log(`SELECT CITY → "${params.message}"`)

      const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

      if (!session || session.state !== 'choosingCity' || !session.activeChangeCityRequestId) {
        return
      }

      await updateSession({ id: session.id, state: 'confirmingCity' })
      exceptionUnsubs.push(() => updateSession({ id: session.id, state: 'idle' }))

      await publicHttpApi.changeCityRequest.POST.selectCity({
        changeCityRequestId: session.activeChangeCityRequestId,
        userId: session.userId,
        selectedCityName: params.message,
      })

      await updateSession({ id: session.id, state: 'idle' })
    } catch (e) {
      await Promise.all(exceptionUnsubs.map(unsub => unsub()))
      log(e instanceof Error ? e.message : String(e))
      await sendMessage('Произошла ошибка при попытке получить список городов. Попробуй позже, пж')
    }
  }
)
