import { buildWriteOperation } from '../../../common/write'
import { relatedEntitiesExist } from '../../../common/guardians'
import { AuthData, Marketplace } from '../../../external'

export interface IUpdateAuthParams {
  id: string
  userId: string
  marketplace: Marketplace
  authData: AuthData
}

export const updateAuth = buildWriteOperation(
  (context, params: IUpdateAuthParams) => {
    return context.authRepo.update({
      id: params.id,
      userId: params.userId,
      marketplace: params.marketplace,
      authData: params.authData,
    })
  },
  [
    relatedEntitiesExist(
      c => c.userRepo,
      p => p.userId
    ),
  ]
)
