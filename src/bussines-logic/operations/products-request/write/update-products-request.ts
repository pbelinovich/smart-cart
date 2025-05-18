import { buildWriteOperation } from '../../../common/write'
import { ProductsRequestStatus } from '../../../external'

export interface IUpdateProductsRequestParams {
  id: string
  status: ProductsRequestStatus
}

export const updateProductsRequest = buildWriteOperation((context, params: IUpdateProductsRequestParams) => {
  return context.productsRequestRepo.update({
    id: params.id,
    status: params.status,
  })
}, [])
