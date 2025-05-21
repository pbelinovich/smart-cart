import { buildWriteOperation } from '../../../common/write'
import { createAiProductsList } from '../../ai-products-list'
import { IAIProduct } from '../../../external'
import { getProductsRequestById } from '../read'
import { updateProductsRequest } from './update-products-request'

export interface IFinishProductsParsingParams {
  productsRequestId: string
  list: IAIProduct[] | undefined
}

export const finishProductsParsing = buildWriteOperation(async (_, params: IFinishProductsParsingParams, { execute }) => {
  const productsRequest = await execute(getProductsRequestById, { id: params.productsRequestId })

  if (!productsRequest || productsRequest.status !== 'productsParsing' || productsRequest.error || !params.list || !params.list.length) {
    if (!productsRequest.error) {
      await execute(updateProductsRequest, { id: params.productsRequestId, error: true })
    }

    return
  }

  await execute(updateProductsRequest, { id: params.productsRequestId, status: 'finishProductsParsing' })
  await execute(createAiProductsList, { productsRequestId: params.productsRequestId, list: params.list })
})
