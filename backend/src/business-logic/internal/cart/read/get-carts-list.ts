import { buildGetPageOperation } from '../../../common/read'

export const getCartsList = buildGetPageOperation(
  c => c.cartRepo.query,
  c => c
)
