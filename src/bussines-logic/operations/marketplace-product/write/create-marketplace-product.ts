import { dateTime } from '@shared'
import { buildWriteOperation } from '../../../common/write'
import { IMarketplaceProductEntity } from '../../../external'

export interface ICreateMarketplaceProductParams {
  cityId: string
  shopId: string
  queryName: string
  productName: string
  productPrice: number
  hash: string
}

export const createMarketplaceProduct = buildWriteOperation((context, params: ICreateMarketplaceProductParams) => {
  const marketplaceProduct: IMarketplaceProductEntity = {
    id: context.marketplaceProductRepo.getNewId(),
    cityId: params.cityId,
    shopId: params.shopId,
    createDate: dateTime.utc().toISOString(),
    queryName: params.queryName,
    productName: params.productName,
    productPrice: params.productPrice,
    hash: params.hash,
  }

  return context.marketplaceProductRepo.create(marketplaceProduct)
}, [])
