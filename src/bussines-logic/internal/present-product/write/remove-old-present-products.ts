import { buildWriteOperation } from '../../../common/write'

export interface IRemoveOldPresentProductsParams {
  limit: number
}

export const removeOldPresentProducts = buildWriteOperation(async (context, params: IRemoveOldPresentProductsParams) => {
  const nowInSeconds = Math.floor(Date.now() / 1000)
  const presentProductsToRemove = await context.presentProductRepo.query
    .where((_, p) => _.le(p('expiresAt'), nowInSeconds))
    .take(params.limit)
    .all()

  await Promise.all(
    presentProductsToRemove.map(({ id }) => {
      return context.presentProductRepo.remove(id)
    })
  )

  return {
    cleanedCount: presentProductsToRemove.length,
  }
})
