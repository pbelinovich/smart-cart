import { buildReadOperation } from '../../../common/read'

export interface IGetProductByProductsRequestIdParams {
  productsRequestId: string
  userId: string
}

export const getProductsByProductsRequestId = buildReadOperation((context, params: IGetProductByProductsRequestIdParams) => {
  return context.productRepo.query.where((_, p) => _.eq(p('productsRequestId'), params.productsRequestId)).all()
})
