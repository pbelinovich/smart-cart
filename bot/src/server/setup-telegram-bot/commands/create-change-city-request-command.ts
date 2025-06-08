import { ChangeCityRequestStatus, IChangeCityRequestEntity } from '@server'
import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { formatChangeCityRequest } from '../tools'
import { updateSessionCommand } from './update-session-command'

export interface IChangeCityRequestCommandParams {
  message: string
}

const statusesToUnsub: ChangeCityRequestStatus[] = ['userCityUpdated', 'canceledByUser']

export const createChangeCityRequestCommand = buildCommand({
  name: 'createChangeCityRequestCommand',
  handler: async (
    { readExecutor, chatId, tgUser, publicHttpApi, send, subscriptionManager },
    params: IChangeCityRequestCommandParams,
    { runCommand }
  ) => {
    const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

    if (!session || session.state !== 'creatingChangeCityRequest') {
      return
    }

    const sendChangeCityRequestUpdate = (next: IChangeCityRequestEntity, prev?: IChangeCityRequestEntity) => {
      if (prev?.status === next.status && prev.error === next.error) {
        return
      }

      const formatted = formatChangeCityRequest(next)

      if (formatted) {
        send(formatted.message, formatted.options)
      }
    }

    const changeCityRequest = await publicHttpApi.changeCityRequest.POST.create({
      userId: session.userId,
      query: params.message,
    })

    sendChangeCityRequestUpdate(changeCityRequest)

    const [channel] = await Promise.all([
      publicHttpApi.changeCityRequest.CHANNEL.getById({
        id: changeCityRequest.id,
        userId: session.userId,
      }),
      runCommand(updateSessionCommand, { state: 'creatingChangeCityRequest', activeChangeCityRequestId: changeCityRequest.id }),
    ])

    sendChangeCityRequestUpdate(channel.getValue(), changeCityRequest)

    subscriptionManager.add(chatId, {
      unsub: channel.subscribe((next, prev) => {
        sendChangeCityRequestUpdate(next, prev)

        if (next.error || statusesToUnsub.includes(next.status)) {
          return subscriptionManager.cleanup(chatId)
        }

        if (next.status === 'citiesFound') {
          return runCommand(updateSessionCommand, { state: 'choosingCity', activeChangeCityRequestId: changeCityRequest.id })
        }
      }),
      destroy: () => {
        return Promise.all([channel.destroy(), runCommand(updateSessionCommand, { state: 'idle' })])
      },
    })
  },
  errorHandler: ({ send }) => {
    send('Произошла ошибка при попытке получить список городов. Попробуй позже, пж')
  },
})
