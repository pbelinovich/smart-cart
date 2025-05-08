import { IUserEntity } from '../../types'
import { buildWriteOperation } from '../../common/write'
import { uniqueEntity } from '../../common/guardians'
import { getUserByTelegramId } from '../read'
import { dateTime } from '@shared'

export interface ICreateUserParams {
  telegramId: number
}

export const createUser = buildWriteOperation(
  (context, params: ICreateUserParams) => {
    const now = dateTime.utc().toISOString()
    const user: IUserEntity = {
      id: context.userRepo.getNewId(),
      telegramId: params.telegramId,
      createDate: now,
      lastActivityDate: now,
    }

    return context.userRepo.create(user)
  },
  [uniqueEntity(({ readExecutor }, { telegramId }) => readExecutor.execute(getUserByTelegramId, { telegramId }))]
)
