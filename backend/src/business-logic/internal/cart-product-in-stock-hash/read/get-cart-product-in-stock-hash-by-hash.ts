import { buildReadOperation } from '../../../common/read'

export interface IGetCartProductInStockHashByHashParams {
  hash: string
}

export const getCartProductInStockHashByHash = buildReadOperation((context, params: IGetCartProductInStockHashByHashParams) => {
  return context.cartProductInStockHashRepo.query.where((_, p) => _.eq(p('hash'), params.hash)).firstOrNull()
})
