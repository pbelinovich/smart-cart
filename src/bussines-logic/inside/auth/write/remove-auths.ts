import { buildWriteOperation } from '../../../common/write'

export interface IRemoveAuthsParams {
  ids: string[]
}

export const removeAuths = buildWriteOperation(async (context, params: IRemoveAuthsParams) => {
  await Promise.all(params.ids.map(id => context.authRepo.remove(id)))
}, [])
