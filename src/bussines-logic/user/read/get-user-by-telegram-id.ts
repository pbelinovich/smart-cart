import { buildReadOperation } from '../../common/read'

export interface IGetUserByTelegramIdParams {
  telegramId: number
}

export const getUserByTelegramId = buildReadOperation((context, params: IGetUserByTelegramIdParams) => {
  return context.userRepo.query.where((_, p) => _.eq(p('telegramId'), params.telegramId)).firstOrNull()
}, [])
