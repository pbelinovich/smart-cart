import { buildWriteOperation } from '../../../common/write'
import { getProductsRequestById } from '../read'
import { updateProductsRequest } from './update-products-request'

export interface IStartProductsCollectingParams {
  productsRequestId: string
}

export const startProductsCollecting = buildWriteOperation(async (_, params: IStartProductsCollectingParams, { execute }) => {
  const productsRequest = await execute(getProductsRequestById, { id: params.productsRequestId })

  if (!productsRequest || productsRequest.status !== 'productsParsed' || productsRequest.error) {
    if (!productsRequest.error) {
      await execute(updateProductsRequest, { id: params.productsRequestId, error: true })
    }

    return false
  }

  await execute(updateProductsRequest, { id: params.productsRequestId, status: 'productsCollecting' })

  return true
})
