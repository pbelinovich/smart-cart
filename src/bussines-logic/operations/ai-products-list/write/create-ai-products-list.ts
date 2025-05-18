import { dateTime } from '@shared'
import { buildWriteOperation } from '../../../common/write'
import { relatedEntitiesExist } from '../../../common/guardians'
import { IAIProductsListEntity, IAIProduct } from '../../../external'

export interface ICreateAIProductsListParams {
  productsRequestId: string
  list: IAIProduct[]
}

export const createAiProductsList = buildWriteOperation(
  (context, params: ICreateAIProductsListParams) => {
    const aiProduct: IAIProductsListEntity = {
      id: context.aiProductsListRepo.getNewId(),
      productsRequestId: params.productsRequestId,
      createDate: dateTime.utc().toISOString(),
      list: params.list.map(x => ({
        name: x.name,
        quantity: x.quantity,
        priceCategory: x.priceCategory,
      })),
    }

    return context.aiProductsListRepo.create(aiProduct)
  },
  [
    relatedEntitiesExist(
      c => c.productsRequestRepo,
      p => p.productsRequestId
    ),
  ]
)
