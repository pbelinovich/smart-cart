import { buildWriteOperation } from '../../../common/write'

export interface IRemoveProductsRequestsParams {
  ids: string[]
}

export const removeProductsRequests = buildWriteOperation(async (context, params: IRemoveProductsRequestsParams) => {
  await Promise.all(params.ids.map(id => context.productsRequestRepo.remove(id)))
}, [])
