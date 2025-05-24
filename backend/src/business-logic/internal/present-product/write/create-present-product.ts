import { dateTime } from '@shared'
import { buildWriteOperation } from '../../../common/write'
import { IPresentProductEntity } from '../../../external'

export interface ICreatePresentProductParams {
  cityId: string
  shopId: string
  queryName: string
  productName: string
  productPrice: number
  hash: string
}

export const createPresentProduct = buildWriteOperation(async (context, params: ICreatePresentProductParams) => {
  const prevPresentProduct = await context.presentProductRepo.query.where((_, p) => _.eq(p('hash'), params.hash)).firstOrNull()

  if (prevPresentProduct) {
    await context.presentProductRepo.remove(prevPresentProduct.id)
  }

  const presentProduct: IPresentProductEntity = {
    id: context.presentProductRepo.getNewId(),
    cityId: params.cityId,
    shopId: params.shopId,
    createDate: dateTime.utc().toISOString(),
    expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 6, // 6 hours
    queryName: params.queryName,
    productName: params.productName,
    productPrice: params.productPrice,
    hash: params.hash,
  }

  return context.presentProductRepo.create(presentProduct)
}, [])
