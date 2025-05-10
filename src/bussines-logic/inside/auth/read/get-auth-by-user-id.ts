import { buildReadOperation } from '../../../common/read'
import { Marketplace } from '../../../external'

export interface IGetAuthByUserIdParams {
  userId: string
  marketplace: Marketplace
}

export const getAuthByUserId = buildReadOperation((context, params: IGetAuthByUserIdParams) => {
  return context.authRepo.query
    .where((_, p) => _.and(_.eq(p('userId'), params.userId), _.eq(p('marketplace'), params.marketplace)))
    .firstOrNull()
}, [])
