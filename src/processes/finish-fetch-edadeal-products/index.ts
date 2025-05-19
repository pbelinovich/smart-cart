import { buildProcessHandler } from '../common'
import { getProductsRequestById, IFinishFetchEdadealProductsParams, updateProductsRequest } from '../external'

export const finishFetchEdadealProducts = buildProcessHandler(
  async ({ readExecutor, writeExecutor }, params: IFinishFetchEdadealProductsParams) => {
    const productsRequest = await readExecutor.execute(getProductsRequestById, { id: params.productsRequestId })

    if (!productsRequest || productsRequest.status !== 'created') {
      return true
    }

    await writeExecutor.execute(updateProductsRequest, {
      id: params.productsRequestId,
      status: params.success ? 'executed' : 'error',
    })

    return true
  }
)
