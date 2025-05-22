import { buildWriteOperation } from '../../../common/write'

export interface IRemoveChangeCityRequestsParams {
  ids: string[]
}

export const removeChangeCityRequests = buildWriteOperation(async (context, params: IRemoveChangeCityRequestsParams) => {
  await Promise.all(params.ids.map(id => context.changeCityRequestRepo.remove(id)))
}, [])
