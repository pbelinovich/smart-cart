import { buildReadOperation } from '../../../common/read'

export interface IGetSessionByUserIdParams {
  userId: string
}

export const getSessionByUserId = buildReadOperation((context, params: IGetSessionByUserIdParams) => {
  return context.sessionRepo.query.where((_, p) => _.eq(p('userId'), params.userId)).firstOrNull()
}, [])
