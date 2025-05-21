import { buildProcessHandler } from '../../common'
import { getProductsRequestById, IParseProductsParams, parseProductsByQuery, updateProductsRequest } from '../../external'

export const parseProducts = buildProcessHandler(async ({ readExecutor, writeExecutor }, params: IParseProductsParams) => {
  const productsRequest = await readExecutor.execute(getProductsRequestById, { id: params.productsRequestId })

  if (!productsRequest || productsRequest.status !== 'productsParsing' || productsRequest.error || !productsRequest.query) {
    if (!productsRequest.error) {
      await writeExecutor.execute(updateProductsRequest, { id: params.productsRequestId, error: true })
    }

    return
  }

  try {
    const products = await readExecutor.execute(parseProductsByQuery, { query: productsRequest.query })

    if (!products || !products.length) {
      throw new Error('No products parsed')
    }

    return products
  } catch (e) {
    await writeExecutor.execute(updateProductsRequest, { id: productsRequest.id, error: true })
  }
})
