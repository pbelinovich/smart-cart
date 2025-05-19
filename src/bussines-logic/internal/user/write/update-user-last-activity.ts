import { buildWriteOperation } from '../../../common/write'
import { dateTime } from '@shared'

export interface IUpdateUserLastActivityParams {
  id: string
}

export const updateUserLastActivity = buildWriteOperation((context, params: IUpdateUserLastActivityParams) => {
  return context.userRepo.update({ id: params.id, lastActivityDate: dateTime.utc().toISOString() })
}, [])
