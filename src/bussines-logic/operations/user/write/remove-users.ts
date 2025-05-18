import { buildWriteOperation } from '../../../common/write'

export interface IRemoveUsersParams {
  ids: string[]
}

export const removeUsers = buildWriteOperation(async (context, params: IRemoveUsersParams) => {
  const userAddresses = await context.userAddressRepo.query.where((_, p) => _.in(p('userId'), params.ids)).all()
  const auths = await context.authRepo.query.where((_, p) => _.in(p('userId'), params.ids)).all()

  await Promise.all([
    ...auths.map(auth => context.authRepo.remove(auth.id)),
    ...userAddresses.map(userAddress => context.userAddressRepo.remove(userAddress.id)),
    ...params.ids.map(id => context.userRepo.remove(id)),
  ])
}, [])
