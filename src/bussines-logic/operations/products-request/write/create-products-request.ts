import { dateTime } from '@shared'
import { buildWriteOperation } from '../../../common/write'
import { IProductsRequestEntity } from '../../../external'
import { relatedEntitiesExist } from '../../../common/guardians'

export interface ICreateProductsRequestParams {
  userId: string
  query: string
}

export const createProductsRequest = buildWriteOperation(
  async (context, params: ICreateProductsRequestParams) => {
    const user = await context.userRepo.getById(params.userId)
    const now = dateTime.utc().toISOString()
    const productsRequest: IProductsRequestEntity = {
      id: context.productsRequestRepo.getNewId(),
      userId: params.userId,
      cityId: user.actualCityId,
      createDate: now,
      query: params.query,
      status: 'created',
    }

    return context.productsRequestRepo.create(productsRequest)
  },
  [
    relatedEntitiesExist(
      c => c.userRepo,
      p => p.userId
    ),
  ]
)
