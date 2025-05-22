import { buildWriteOperation } from '../../../common/write'
import { ProductsRequestStatus, IAIProduct, ICart } from '../../../external'
import { dateTime } from '@shared'

export interface IUpdateProductsRequestParams {
  id: string
  status?: ProductsRequestStatus
  error?: boolean
  aiProducts?: IAIProduct[]
  carts?: ICart[]
}

export const updateProductsRequest = buildWriteOperation(async (context, params: IUpdateProductsRequestParams) => {
  const productsRequest = await context.productsRequestRepo.getById(params.id)

  return context.productsRequestRepo.update({
    id: params.id,
    modifyDate: dateTime().utc().toISOString(),
    status: params.status || productsRequest.status,
    error: params.error === undefined ? productsRequest.error : params.error,
    aiProducts: params.aiProducts || productsRequest.aiProducts,
    carts: params.carts || productsRequest.carts,
  })
}, [])
