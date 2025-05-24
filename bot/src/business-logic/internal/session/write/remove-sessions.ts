import { buildWriteOperation } from '../../../common/write'

export interface IRemoveSessionsParams {
  ids: string[]
}

export const removeSessions = buildWriteOperation(async (context, params: IRemoveSessionsParams) => {
  await Promise.all(params.ids.map(id => context.sessionRepo.remove(id)))
}, [])
