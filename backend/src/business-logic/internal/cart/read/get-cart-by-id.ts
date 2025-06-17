import { buildGetByIdOperation } from '../../../common/read'

export const getCartById = buildGetByIdOperation(c => c.cartRepo, [])
