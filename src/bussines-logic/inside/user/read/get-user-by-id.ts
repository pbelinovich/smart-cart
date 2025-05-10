import { buildGetByIdOperation } from '../../../common/read'

export const getUserById = buildGetByIdOperation(c => c.userRepo, [])
