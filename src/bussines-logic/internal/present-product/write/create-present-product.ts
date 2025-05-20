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

export const createPresentProduct = buildWriteOperation((context, params: ICreatePresentProductParams) => {
  const presentProduct: IPresentProductEntity = {
    id: context.presentProductRepo.getNewId(),
    cityId: params.cityId,
    shopId: params.shopId,
    createDate: dateTime.utc().toISOString(),
    queryName: params.queryName,
    productName: params.productName,
    productPrice: params.productPrice,
    hash: params.hash,
  }

  return context.presentProductRepo.create(presentProduct)
}, [])
