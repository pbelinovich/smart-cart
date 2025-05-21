import { buildWriteOperation } from '../../../common/write'
import { getProductsRequestById } from '../read'
import { updateProductsRequest } from './update-products-request'

export interface IStartProductsParsingParams {
  productsRequestId: string
}

export const startProductsParsing = buildWriteOperation(async (_, params: IStartProductsParsingParams, { execute }) => {
  const productsRequest = await execute(getProductsRequestById, { id: params.productsRequestId })

  if (!productsRequest || productsRequest.status !== 'created' || productsRequest.error) {
    if (!productsRequest.error) {
      await execute(updateProductsRequest, { id: params.productsRequestId, error: true })
    }

    return
  }

  await execute(updateProductsRequest, { id: params.productsRequestId, status: 'startProductsParsing' })
})
