import { ChangeCityRequestStatus, IChangeCityRequestEntity } from '@server'
import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { formatChangeCityRequest } from '../tools'

export interface IChangeCityRequestCommandParams {
  message: string
}

export const changeCityRequestCommand = buildCommand(
  async ({ readExecutor, tgUser, publicHttpApi, sendMessage, log, updateSession }, params: IChangeCityRequestCommandParams) => {
    const exceptionUnsubs: (() => Promise<void> | void)[] = []

    try {
      log(`CHANGE CITY → "${params.message}"`)

      const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

      if (!session || session.state !== 'creatingChangeCityRequest') {
        return
      }

      exceptionUnsubs.push(() => updateSession({ id: session.id, state: 'idle' }))

      let prevChangeCityRequest: IChangeCityRequestEntity | undefined

      const sendChangeCityRequestUpdate = async (changeCityRequest: IChangeCityRequestEntity) => {
        if (prevChangeCityRequest?.status === changeCityRequest.status && prevChangeCityRequest.error === changeCityRequest.error) {
          return
        }

        prevChangeCityRequest = changeCityRequest

        const formatted = formatChangeCityRequest(changeCityRequest)

        if (formatted) {
          await sendMessage(formatted.message, formatted.options)
        }
      }

      const changeCityRequest = await publicHttpApi.changeCityRequest.POST.create({
        userId: session.userId,
        query: params.message,
      })

      await Promise.all([
        sendChangeCityRequestUpdate(changeCityRequest),
        updateSession({
          id: session.id,
          state: 'creatingChangeCityRequest',
          activeChangeCityRequestId: changeCityRequest.id,
        }),
      ])

      const changeCityRequestChannel = await publicHttpApi.changeCityRequest.CHANNEL.getById({
        id: changeCityRequest.id,
        userId: session.userId,
      })

      await sendChangeCityRequestUpdate(changeCityRequestChannel.getValue())

      let prev: IChangeCityRequestEntity | undefined

      const unsubFromChangeCityRequest = changeCityRequestChannel.subscribe(async next => {
        if (prev?.status === next.status && prev.error === next.error) {
          return
        }

        prev = next

        const statusesToUnsub: ChangeCityRequestStatus[] = ['userCityUpdated', 'canceledByUser']
        const needUnsub = next.error || statusesToUnsub.includes(next.status)

        if (needUnsub || next.status === 'citiesFound') {
          if (needUnsub) {
            unsubFromChangeCityRequest()
          }

          await Promise.all([
            needUnsub ? changeCityRequestChannel.destroy() : undefined,
            updateSession({
              id: session.id,
              state: needUnsub ? 'idle' : 'choosingCity',
              activeChangeCityRequestId: needUnsub ? undefined : changeCityRequest.id,
            }),
          ])
        }

        await sendChangeCityRequestUpdate(next)
      })

      exceptionUnsubs.push(unsubFromChangeCityRequest, changeCityRequestChannel.destroy)
    } catch (e) {
      await Promise.all(exceptionUnsubs.map(unsub => unsub()))
      log(e instanceof Error ? e.message : String(e))
      await sendMessage('Произошла ошибка при попытке получить список городов. Попробуй позже, пж')
    }
  }
)
