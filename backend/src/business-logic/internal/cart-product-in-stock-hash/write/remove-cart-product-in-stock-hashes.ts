import { buildWriteOperation } from '../../../common/write'

export interface IRemoveCartProductInStockHashesParams {
  ids: string[]
}

export const removeCartProductInStockHashes = buildWriteOperation(async (context, params: IRemoveCartProductInStockHashesParams) => {
  await Promise.all(params.ids.map(id => context.cartProductInStockHashRepo.remove(id)))
}, [])
