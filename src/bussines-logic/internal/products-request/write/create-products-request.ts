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
    const productsRequest: IProductsRequestEntity = {
      id: context.productsRequestRepo.getNewId(),
      userId: params.userId,
      cityId: user.actualCityId,
      createDate: dateTime.utc().toISOString(),
      query: params.query.replace(/\s+/g, ' ').trim(),
      status: 'created',
      error: false,
      aiProducts: [],
      carts: [],
    }

    const created = await context.productsRequestRepo.create(productsRequest)
    return created.id
  },
  [
    relatedEntitiesExist(
      c => c.userRepo,
      p => p.userId
    ),
  ]
)
