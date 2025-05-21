import { dateTime } from '@shared'
import { buildWriteOperation } from '../../../common/write'
import { IProductsResponseEntity } from '../../../external'
import { relatedEntitiesExist } from '../../../common/guardians'

export interface ICreateProductsResponseParams {
  productsRequestId: string
  data: any
}

export const createProductsResponse = buildWriteOperation(
  (context, params: ICreateProductsResponseParams) => {
    const productsRequest: IProductsResponseEntity = {
      id: context.productsResponseRepo.getNewId(),
      productsRequestId: params.productsRequestId,
      createDate: dateTime.utc().toISOString(),
      data: params.data,
    }

    return context.productsResponseRepo.create(productsRequest)
  },
  [
    relatedEntitiesExist(
      c => c.productsRequestRepo,
      p => p.productsRequestId
    ),
  ]
)
