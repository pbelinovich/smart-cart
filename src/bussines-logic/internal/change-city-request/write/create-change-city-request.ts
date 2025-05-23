import { buildWriteOperation } from '../../../common/write'
import { IChangeCityRequestEntity } from '../../../external'
import { relatedEntitiesExist } from '../../../common/guardians'
import { dateTime } from '@shared'

export interface ICreateChangeCityRequestParams {
  userId: string
  query: string
}

export const createChangeCityRequest = buildWriteOperation(
  (context, params: ICreateChangeCityRequestParams) => {
    const changeCityRequest: IChangeCityRequestEntity = {
      id: context.changeCityRequestRepo.getNewId(),
      userId: params.userId,
      createDate: dateTime.utc().toISOString(),
      expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      query: params.query.replace(/\s+/g, ' ').trim(),
      status: 'created',
      error: false,
      cities: [],
    }

    return context.changeCityRequestRepo.create(changeCityRequest)
  },
  [
    relatedEntitiesExist(
      c => c.userRepo,
      p => p.userId
    ),
  ]
)
