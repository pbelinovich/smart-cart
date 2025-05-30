import { ChangeCityRequestStatus, IChangeCityRequestEntity } from '@server'
import { buildCommand } from '../builder'
import { getSessionByTelegramId } from '../../external'
import { formatChangeCityRequest } from '../tools'
import { updateSessionCommand } from './update-session-command'

export interface IChangeCityRequestCommandParams {
  message: string
}

export const createChangeCityRequestCommand = buildCommand(
  'createChangeCityRequestCommand',
  async ({ readExecutor, tgUser, publicHttpApi, send, log }, params: IChangeCityRequestCommandParams, { runCommand }) => {
    const exceptionUnsubs: (() => Promise<any> | void)[] = []

    try {
      log(`CHANGE CITY → "${params.message}"`)

      const session = await readExecutor.execute(getSessionByTelegramId, { telegramId: tgUser.id })

      if (!session || session.state !== 'creatingChangeCityRequest') {
        return
      }

      exceptionUnsubs.push(() => runCommand(updateSessionCommand, { state: 'idle' }))

      let prevChangeCityRequest: IChangeCityRequestEntity | undefined

      const sendChangeCityRequestUpdate = (changeCityRequest: IChangeCityRequestEntity) => {
        if (prevChangeCityRequest?.status === changeCityRequest.status && prevChangeCityRequest.error === changeCityRequest.error) {
          return
        }

        prevChangeCityRequest = changeCityRequest

        const formatted = formatChangeCityRequest(changeCityRequest)

        if (formatted) {
          send(formatted.message, formatted.options)
        }
      }

      const changeCityRequest = await publicHttpApi.changeCityRequest.POST.create({
        userId: session.userId,
        query: params.message,
      })

      sendChangeCityRequestUpdate(changeCityRequest)

      await runCommand(updateSessionCommand, {
        state: 'creatingChangeCityRequest',
        activeChangeCityRequestId: changeCityRequest.id,
      })

      const changeCityRequestChannel = await publicHttpApi.changeCityRequest.CHANNEL.getById({
        id: changeCityRequest.id,
        userId: session.userId,
      })

      sendChangeCityRequestUpdate(changeCityRequestChannel.getValue())

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
            runCommand(updateSessionCommand, {
              state: needUnsub ? 'idle' : 'choosingCity',
              activeChangeCityRequestId: needUnsub ? undefined : changeCityRequest.id,
            }),
          ])
        }

        sendChangeCityRequestUpdate(next)
      })

      exceptionUnsubs.push(unsubFromChangeCityRequest, changeCityRequestChannel.destroy)
    } catch (e) {
      await Promise.all(exceptionUnsubs.map(unsub => unsub()))
      log(e instanceof Error ? e.message : String(e))
      send('Произошла ошибка при попытке получить список городов. Попробуй позже, пж')
    }
  }
)
