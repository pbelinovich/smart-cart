import { buildWriteOperation } from '../../../common/write'
import { dateTime } from '@shared'

export interface IUpdateUserParams {
  id: string
  telegramId?: number
  actualUserAddressId?: string
}

export const updateUser = buildWriteOperation(async (context, params: IUpdateUserParams) => {
  const prevUser = await context.userRepo.getById(params.id)

  return context.userRepo.update({
    id: params.id,
    telegramId: params.telegramId || prevUser.telegramId,
    lastActivityDate: dateTime.utc().toISOString(),
    actualUserAddressId: params.actualUserAddressId || prevUser.actualUserAddressId,
  })
}, [])
