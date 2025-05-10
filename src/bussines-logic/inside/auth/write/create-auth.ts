import { buildWriteOperation } from '../../../common/write'
import { relatedEntitiesExist } from '../../../common/guardians'
import { dateTime } from '@shared'
import { AuthData, IAuthEntity, Marketplace } from '../../../external'

export interface ICreateAuthParams {
  userId: string
  marketplace: Marketplace
  authData: AuthData
}

export const createAuth = buildWriteOperation(
  (context, params: ICreateAuthParams) => {
    const auth: IAuthEntity = {
      id: context.authRepo.getNewId(),
      userId: params.userId,
      createDate: dateTime.utc().toISOString(),
      marketplace: params.marketplace,
      authData: params.authData,
    }

    return context.authRepo.create(auth)
  },
  [
    relatedEntitiesExist(
      c => c.userRepo,
      p => p.userId
    ),
  ]
)
