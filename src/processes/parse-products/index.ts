import { buildProcessHandler } from '../common'
import { createAiProductsList, getProductsRequestById, IParseProductsParams, parseProductsByQuery } from '../external'

export const parseProducts = buildProcessHandler(async ({ readExecutor, writeExecutor }, params: IParseProductsParams) => {
  const productsRequest = await readExecutor.execute(getProductsRequestById, { id: params.productsRequestId })

  if (!productsRequest || productsRequest.status !== 'created' || !productsRequest.query) {
    return true
  }

  try {
    const list = await readExecutor.execute(parseProductsByQuery, { query: productsRequest.query })

    if (list.length) {
      await writeExecutor.execute(createAiProductsList, { productsRequestId: productsRequest.id, list })
    }
  } catch (e) {
    return false
  }

  return true
})
