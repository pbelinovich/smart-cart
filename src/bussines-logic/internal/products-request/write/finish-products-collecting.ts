import { buildWriteOperation } from '../../../common/write'
import { getProductsRequestById } from '../read'
import { updateProductsRequest } from './update-products-request'

export interface IFinishProductsCollectingParams {
  productsRequestId: string
  success: boolean
}

export const finishProductsCollecting = buildWriteOperation(async (_, params: IFinishProductsCollectingParams, { execute }) => {
  const productsRequest = await execute(getProductsRequestById, { id: params.productsRequestId })

  if (!productsRequest || productsRequest.status !== 'productsCollecting' || productsRequest.error) {
    if (!productsRequest.error) {
      await execute(updateProductsRequest, { id: params.productsRequestId, error: true })
    }

    return
  }

  await execute(updateProductsRequest, {
    id: params.productsRequestId,
    status: 'finishProductsCollecting',
    error: !params.success,
  })
})
