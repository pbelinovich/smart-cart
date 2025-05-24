import { buildReadOperation } from '../../../common/read'

export interface IGetSessionByTelegramIdParams {
  telegramId: number
}

export const getSessionByTelegramId = buildReadOperation((context, params: IGetSessionByTelegramIdParams) => {
  return context.sessionRepo.query.where((_, p) => _.eq(p('telegramId'), params.telegramId)).firstOrNull()
}, [])
