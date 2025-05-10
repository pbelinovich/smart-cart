import { buildGetByIdOperation } from '../../../common/read'

export const getUserAddressById = buildGetByIdOperation(c => c.userAddressRepo, [])
