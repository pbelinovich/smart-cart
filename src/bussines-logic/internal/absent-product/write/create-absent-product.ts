import { dateTime } from '@shared'
import { buildWriteOperation } from '../../../common/write'
import { IAbsentProductEntity } from '../../../external'

export interface ICreateAbsentProductParams {
  cityId: string
  shopId: string
  queryName: string
  hash: string
}

export const createAbsentProduct = buildWriteOperation((context, params: ICreateAbsentProductParams) => {
  const absentProduct: IAbsentProductEntity = {
    id: context.absentProductRepo.getNewId(),
    cityId: params.cityId,
    shopId: params.shopId,
    createDate: dateTime.utc().toISOString(),
    queryName: params.queryName,
    hash: params.hash,
  }

  return context.absentProductRepo.create(absentProduct)
}, [])
