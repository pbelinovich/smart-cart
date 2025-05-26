import { IUserEntity } from '../../../types'
import { buildWriteOperation } from '../../../common/write'
import { uniqueEntity } from '../../../common/guardians'
import { getUserByTelegramId } from '../read'
import { dateTime } from '@shared'
import { getDefaultCity } from '../../city'

export interface ICreateUserParams {
  telegramId: number
  telegramLogin?: string
  telegramFirstName?: string
  telegramLastName?: string
}

export const createUser = buildWriteOperation(
  async (context, params: ICreateUserParams, { execute }) => {
    const defaultCity = await execute(getDefaultCity, {})

    if (!defaultCity) {
      throw new Error('Default city not found')
    }

    const now = dateTime.utc().toISOString()
    const user: IUserEntity = {
      id: context.userRepo.getNewId(),
      telegramId: params.telegramId,
      telegramLogin: params.telegramLogin,
      telegramFirstName: params.telegramFirstName,
      telegramLastName: params.telegramLastName,
      createDate: now,
      lastActivityDate: now,
      actualCityId: defaultCity.id,
    }

    return context.userRepo.create(user)
  },
  [uniqueEntity(({ readExecutor }, { telegramId }) => readExecutor.execute(getUserByTelegramId, { telegramId }))]
)
