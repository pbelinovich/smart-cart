import { buildReadOperation } from '../../../common/read'

export interface IGetUserAddressByUserIdParams {
  userId: string
}

export const getUserAddressByUserId = buildReadOperation((context, params: IGetUserAddressByUserIdParams) => {
  return context.userAddressRepo.query.where((_, p) => _.eq(p('userId'), params.userId)).firstOrNull()
}, [])
