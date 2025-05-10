import { buildWriteOperation } from '../../../common/write'
import { relatedEntitiesExist } from '../../../common/guardians'

export interface IRemoveUserAddressesParams {
  userId: string
  ids: string[]
}

export const removeUserAddressesByUserId = buildWriteOperation(
  async (context, params: IRemoveUserAddressesParams) => {
    const userAddresses = await context.userAddressRepo.query.where((_, p) => _.eq(p('userId'), params.userId)).all()
    const userAddressIdsToRemoveMap = params.ids.reduce<{ [id: string]: true }>((acc, id) => {
      acc[id] = true
      return acc
    }, {})

    const nextActualUserAddress = userAddresses.find(userAddress => !userAddressIdsToRemoveMap[userAddress.id])

    await Promise.all([
      context.userRepo.update({ id: params.userId, actualUserAddressId: nextActualUserAddress?.id }),
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
