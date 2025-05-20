import { buildProcessHandler } from '../../common'
import { getProductsRequestById, IFinishCollectingProductsParams, updateProductsRequest } from '../../external'

export const finishProductsCollecting = buildProcessHandler(
  async ({ readExecutor, writeExecutor }, params: IFinishCollectingProductsParams) => {
    const productsRequest = await readExecutor.execute(getProductsRequestById, { id: params.productsRequestId })

    if (!productsRequest || productsRequest.status !== 'collecting') {
      await writeExecutor.execute(updateProductsRequest, {
        id: params.productsRequestId,
        status: 'errorWhileCollecting',
      })

      return false
    }

    await writeExecutor.execute(updateProductsRequest, {
      id: params.productsRequestId,
      status: params.success ? 'collected' : 'errorWhileCollecting',
    })

    return true
  }
)
