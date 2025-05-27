import { ISessionEntity } from '../../../types'
import { buildWriteOperation } from '../../../common/write'
import { uniqueEntity } from '../../../common/guardians'
import { getSessionByTelegramId, getSessionByUserId } from '../read'
import { dateTime } from '@shared'
import { SessionState } from '../../../external'

export interface ICreateSessionParams {
  userId: string
  telegramId: number
  state: SessionState
  activeProductsRequestId?: string
  activeChangeCityRequestId?: string
}

export const createSession = buildWriteOperation(
  (context, params: ICreateSessionParams) => {
    const session: ISessionEntity = {
      id: context.sessionRepo.getNewId(),
      userId: params.userId,
      telegramId: params.telegramId,
      createDate: dateTime.utc().toISOString(),
      expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
      state: params.state,
    }

    return context.sessionRepo.create(session)
  },
  [
    uniqueEntity(({ readExecutor }, { userId }) => readExecutor.execute(getSessionByUserId, { userId })),
    uniqueEntity(({ readExecutor }, { telegramId }) => readExecutor.execute(getSessionByTelegramId, { telegramId })),
  ]
)
