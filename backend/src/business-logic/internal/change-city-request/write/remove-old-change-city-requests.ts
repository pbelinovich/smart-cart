import { buildWriteOperation } from '../../../common/write'

export interface IRemoveOldChangeCitiesRequestsParams {
  limit: number
}

export const removeOldChangeCityRequests = buildWriteOperation(async (context, params: IRemoveOldChangeCitiesRequestsParams) => {
  const nowInSeconds = Math.floor(Date.now() / 1000)
  const productsRequestsToRemove = await context.changeCityRequestRepo.query
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
