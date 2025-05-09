import { buildWriteOperation } from '../../../common/write'

export interface IRemoveUsersParams {
  ids: string[]
}

export const removeUsers = buildWriteOperation(async (context, params: IRemoveUsersParams) => {
  await Promise.all(params.ids.map(id => context.userRepo.remove(id)))
}, [])
