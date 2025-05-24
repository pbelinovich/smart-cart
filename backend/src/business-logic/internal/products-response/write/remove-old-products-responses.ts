import { buildWriteOperation } from '../../../common/write'

export interface IRemoveOldProductsResponsesParams {
  limit: number
}

export const removeOldProductsResponses = buildWriteOperation(async (context, params: IRemoveOldProductsResponsesParams) => {
  const nowInSeconds = Math.floor(Date.now() / 1000)
  const productsResponsesToRemove = await context.productsResponseRepo.query
    .where((_, p) => _.le(p('expiresAt'), nowInSeconds))
    .take(params.limit)
    .all()

  if (productsResponsesToRemove.length) {
    await Promise.all(
      productsResponsesToRemove.map(({ id }) => {
        return context.productsResponseRepo.remove(id)
      })
    )
  }

  return {
    cleanedCount: productsResponsesToRemove.length,
  }
}, [])
