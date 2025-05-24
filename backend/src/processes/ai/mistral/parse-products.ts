import { buildProcessHandler } from '../../common'
import { getProductsRequestById, IParseProductsParams, parseProductsByQuery, ProductsRequestStatus } from '../../external'

export const parseProducts = buildProcessHandler(async ({ readExecutor }, params: IParseProductsParams) => {
  const productsRequest = await readExecutor.execute(getProductsRequestById, { id: params.productsRequestId })

  if (!productsRequest) {
    throw new Error('Products request not found')
  }

  const productsParsingStatus: ProductsRequestStatus = 'productsParsing'

  if (productsRequest.status !== productsParsingStatus) {
    throw new Error(`Products request has must be ${productsParsingStatus} but it is ${productsRequest.status}`)
  }

  if (productsRequest.error) {
    throw new Error('Products request has error')
  }

  const products = await readExecutor.execute(parseProductsByQuery, { query: productsRequest.query })

  if (!products || !products.length) {
    throw new Error('No products parsed')
  }

  return products
})
