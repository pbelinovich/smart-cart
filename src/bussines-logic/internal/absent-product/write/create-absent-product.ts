import { dateTime } from '@shared'
import { buildWriteOperation } from '../../../common/write'
import { IAbsentProductEntity } from '../../../external'

export interface ICreateAbsentProductParams {
  cityId: string
  shopId: string
  queryName: string
  hash: string
}

export const createAbsentProduct = buildWriteOperation(async (context, params: ICreateAbsentProductParams) => {
  const prevAbsentProduct = await context.presentProductRepo.query.where((_, p) => _.eq(p('hash'), params.hash)).firstOrNull()

  if (prevAbsentProduct) {
    await context.presentProductRepo.remove(prevAbsentProduct.id)
  }

  const absentProduct: IAbsentProductEntity = {
    id: context.absentProductRepo.getNewId(),
    cityId: params.cityId,
    shopId: params.shopId,
    createDate: dateTime.utc().toISOString(),
    expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 6, // 6 hours
    queryName: params.queryName,
    hash: params.hash,
  }

  return context.absentProductRepo.create(absentProduct)
}, [])
