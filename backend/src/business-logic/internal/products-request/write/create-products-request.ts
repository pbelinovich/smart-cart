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
      expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      // query: params.query.replace(/\s+/g, ' ').trim(),
      query: params.query.trim(),
      status: 'created',
      error: false,
      aiProducts: [],
      carts: [],
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
