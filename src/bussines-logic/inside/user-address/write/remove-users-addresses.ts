import { buildWriteOperation } from '../../../common/write'

export interface IRemoveUserAddressesParams {
  ids: string[]
}

export const removeUsersAddresses = buildWriteOperation(async (context, params: IRemoveUserAddressesParams) => {
  await Promise.all(params.ids.map(id => context.userAddressRepo.remove(id)))
}, [])
