import { dateTime } from '@shared'
import { buildWriteOperation } from '../../../common/write'
import { IPresentProductEntity, IMarketplaceProduct } from '../../../external'

export interface ICreatePresentProductParams {
  cityId: string
  shopId: string
  queryName: string
  hash: string
  products: IMarketplaceProduct[]
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
    hash: params.hash,
    marketplaceProducts: params.products,
  }

  return context.presentProductRepo.create(presentProduct)
}, [])
