import { buildWriteOperation } from '../../../common/write'
import { dateTime } from '@shared'

export interface IUpdateUserParams {
  id: string
  telegramId?: number
  telegramLogin?: string
  telegramFirstName?: string
  telegramLastName?: string
  actualCityId?: string
}

export const updateUser = buildWriteOperation(async (context, params: IUpdateUserParams) => {
  const prevUser = await context.userRepo.getById(params.id)

  return context.userRepo.update({
    id: params.id,
    telegramId: params.telegramId || prevUser.telegramId,
    telegramLogin: params.telegramLogin || prevUser.telegramLogin,
    telegramFirstName: params.telegramFirstName || prevUser.telegramFirstName,
    telegramLastName: params.telegramLastName || prevUser.telegramLastName,
    lastActivityDate: dateTime.utc().toISOString(),
    actualCityId: params.actualCityId || prevUser.actualCityId,
  })
}, [])
