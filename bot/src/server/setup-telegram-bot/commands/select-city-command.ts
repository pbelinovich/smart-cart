import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { updateSessionCommand } from './update-session-command'

export interface ISelectCityCommandParams {
  selectedCityId: string
}

export const selectCityCommand = buildCommand({
  name: 'selectCityCommand',
  handler: async ({ readExecutor, tgUser, publicHttpApi }, params: ISelectCityCommandParams, { runCommand }) => {
    const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

    if (!session || session.state !== 'choosingCity' || !session.activeChangeCityRequestId) {
      return
    }

    await Promise.all([
      runCommand(updateSessionCommand, { state: 'confirmingCity' }),
      publicHttpApi.changeCityRequest.POST.selectCity({
        changeCityRequestId: session.activeChangeCityRequestId,
        userId: session.userId,
        selectedCityId: params.selectedCityId,
      }),
    ])

    return runCommand(updateSessionCommand, { state: 'idle' })
  },
  errorHandler: async ({ telegram }) => {
    await telegram.sendMessage({ message: 'Произошла ошибка при попытке получить список городов. Попробуй позже, пж' })
  },
})
