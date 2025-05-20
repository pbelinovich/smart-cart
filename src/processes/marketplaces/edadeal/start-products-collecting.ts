import { buildProcessHandler } from '../../common'
import { getProductsRequestById, IStartCollectingProductsParams, updateProductsRequest } from '../../external'

export const startProductsCollecting = buildProcessHandler(
  async ({ readExecutor, writeExecutor }, params: IStartCollectingProductsParams) => {
    const productsRequest = await readExecutor.execute(getProductsRequestById, { id: params.productsRequestId })

    if (!productsRequest || productsRequest.status !== 'aiParsed') {
      await writeExecutor.execute(updateProductsRequest, {
        id: params.productsRequestId,
        status: 'errorWhileCollecting',
      })

      return false
    }

    await writeExecutor.execute(updateProductsRequest, {
      id: params.productsRequestId,
      status: 'collecting',
    })

    return true
  }
)
