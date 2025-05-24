import { buildWriteOperation } from '../../../common/write'

export interface IRemoveCitiesParams {
  ids: string[]
}

export const removeCities = buildWriteOperation(async (context, params: IRemoveCitiesParams) => {
  await Promise.all(params.ids.map(id => context.cityRepo.remove(id)))
}, [])
