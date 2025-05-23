import { buildWriteOperation } from '../../../common/write'

export interface IRemoveOldAbsentProductsParams {
  limit: number
}

export const removeOldAbsentProducts = buildWriteOperation(async (context, params: IRemoveOldAbsentProductsParams) => {
  const nowInSeconds = Math.floor(Date.now() / 1000)
  const absentProductsToRemove = await context.absentProductRepo.query
    .where((_, p) => _.le(p('expiresAt'), nowInSeconds))
    .take(params.limit)
    .all()

  await Promise.all(
    absentProductsToRemove.map(({ id }) => {
      return context.absentProductRepo.remove(id)
    })
  )

  return {
    cleanedCount: absentProductsToRemove.length,
  }
})
