import { buildWriteOperation } from '../../../common/write'

export interface IRemoveOldProductsRequestsParams {
  limit: number
}

export const removeOldProductsRequests = buildWriteOperation(async (context, params: IRemoveOldProductsRequestsParams) => {
  const nowInSeconds = Math.floor(Date.now() / 1000)
  const productsRequestsToRemove = await context.productsRequestRepo.query
    .where((_, p) => _.le(p('expiresAt'), nowInSeconds))
    .take(params.limit)
    .all()

  if (productsRequestsToRemove.length) {
    await Promise.all(
      productsRequestsToRemove.map(({ id }) => {
        return context.productsRequestRepo.remove(id)
      })
    )
  }

  return {
    cleanedCount: productsRequestsToRemove.length,
  }
}, [])
