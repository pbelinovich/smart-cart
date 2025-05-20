import { dateTime } from '@shared'
import { buildWriteOperation } from '../../../common/write'
import { IProductEntity } from '../../../external'
import { relatedEntitiesExist } from '../../../common/guardians'

export interface ICreateProductParams {
  productsRequestId: string
  cachedProductHash: string
  quantity: string
}

export const createProduct = buildWriteOperation(
  (context, params: ICreateProductParams) => {
    const product: IProductEntity = {
      id: context.productRepo.getNewId(),
      productsRequestId: params.productsRequestId,
      createDate: dateTime.utc().toISOString(),
      cachedProductHash: params.cachedProductHash,
      quantity: params.quantity,
    }

    return context.productRepo.create(product)
  },
  [
    relatedEntitiesExist(
      c => c.productsRequestRepo,
      p => p.productsRequestId
    ),
  ]
)
