import { ChangeCityRequestStatus, IChangeCityRequestEntity } from '@server'
import { buildCommand } from '../builder'
import { getSessionByTelegramId, logError } from '../../external'
import { formatChangeCityRequest, formatErrorChangeCityRequest } from '../tools'
import { updateSessionCommand } from './update-session-command'
import { getSelectCityAction, ISendMessageParams } from '../common'
import { Markup } from 'telegraf'
import { chunkArray } from '../tools/chunk-array'

export interface IChangeCityRequestCommandParams {
  message: string
}

const statusesToUnsub: ChangeCityRequestStatus[] = ['userCityUpdated', 'canceledByUser']

export const createChangeCityRequestCommand = buildCommand({
  name: 'createChangeCityRequestCommand',
  handler: async (
    { readExecutor, chatId, tgUser, publicHttpApi, telegram, subscriptionManager },
    params: IChangeCityRequestCommandParams,
    { runCommand }
  ) => {
    const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

    if (!session || session.state !== 'creatingChangeCityRequest') {
      return
    }

    let messageId: number | undefined

    const sendMessage = async (params: ISendMessageParams) => {
      if (messageId) {
        return telegram.editMessage(messageId, params)
      }

      messageId = await telegram.sendMessage(params)
    }

    const handleChangeCityRequestUpdate = async (next: IChangeCityRequestEntity, prev?: IChangeCityRequestEntity) => {
      try {
        if (prev?.status === next.status && prev.error === next.error) {
          return
        }

        if (next.error) {
          const message = formatErrorChangeCityRequest(next)
          return message ? sendMessage({ message }) : undefined
        }

        if (next.status === 'citiesFound') {
          if (!next.cities.length) {
            return sendMessage({ message: '🤖 Я не нашел ни одного города, попробуй по-другому' })
          }

          const cities = chunkArray(next.cities)
          const buttonsLines = cities.map(item => item.map(city => Markup.button.callback(city.name, getSelectCityAction(city.id))))

          buttonsLines.push([Markup.button.callback('❌ Отменить', 'cancel')])

          return Promise.all([
            sendMessage({ message: '⬇ Выбери город', markup: Markup.inlineKeyboard(buttonsLines) }),
            runCommand(updateSessionCommand, { state: 'choosingCity', activeChangeCityRequestId: next.id }),
          ])
        }

        const message = formatChangeCityRequest(next)

        if (message) {
          return sendMessage({ message })
        }
      } catch (e) {
        logError(e)
        await telegram.sendMessage({ message: 'Произошла ошибка при попытке получить список городов. Попробуй позже, пж' })
      }
    }

    const changeCityRequest = await publicHttpApi.changeCityRequest.POST.create({
      userId: session.userId,
      query: params.message,
    })

    await handleChangeCityRequestUpdate(changeCityRequest)

    const [channel] = await Promise.all([
      publicHttpApi.changeCityRequest.CHANNEL.getById({
        id: changeCityRequest.id,
        userId: session.userId,
      }),
      runCommand(updateSessionCommand, { state: 'creatingChangeCityRequest', activeChangeCityRequestId: changeCityRequest.id }),
    ])

    await handleChangeCityRequestUpdate(channel.getValue(), changeCityRequest)

    subscriptionManager.add(chatId, {
      unsub: channel.subscribe(async (next, prev) => {
        if (next.error || statusesToUnsub.includes(next.status)) {
          await subscriptionManager.cleanup(chatId)
        }

        await handleChangeCityRequestUpdate(next, prev)
      }),
      destroy: () => {
        return Promise.all([channel.destroy(), runCommand(updateSessionCommand, { state: 'idle' })])
      },
    })
  },
  errorHandler: async ({ telegram }) => {
    await telegram.sendMessage({ message: 'Произошла ошибка при попытке получить список городов. Попробуй позже, пж' })
  },
})
