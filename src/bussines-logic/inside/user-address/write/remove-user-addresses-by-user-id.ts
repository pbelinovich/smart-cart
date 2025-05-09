import { buildWriteOperation } from '../../../common/write'
import { relatedEntitiesExist } from '../../../common/guardians'

export interface IRemoveUserAddressesParams {
  userId: string
}

export const removeUserAddressesByUserId = buildWriteOperation(
  async (context, params: IRemoveUserAddressesParams) => {
    const userAddresses = await context.userAddressRepo.query.where((_, p) => _.eq(p('userId'), params.userId)).all()

    await Promise.all([
      context.userRepo.update({ id: params.userId, currentUserAddressId: undefined }),
      ...userAddresses.map(userAddress => context.userAddressRepo.remove(userAddress.id)),
    ])
  },
  [
    relatedEntitiesExist(
      c => c.userRepo,
      p => p.userId
    ),
  ]
)
