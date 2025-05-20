import { buildProcessHandler } from '../../common'
import {
  createAiProductsList,
  getProductsRequestById,
  IParseProductsParams,
  parseProductsByQuery,
  updateProductsRequest,
} from '../../external'

export const parseProducts = buildProcessHandler(async ({ readExecutor, writeExecutor }, params: IParseProductsParams) => {
  const productsRequest = await readExecutor.execute(getProductsRequestById, { id: params.productsRequestId })

  if (!productsRequest || productsRequest.status !== 'created' || !productsRequest.query) {
    await writeExecutor.execute(updateProductsRequest, { id: params.productsRequestId, status: 'errorWhileAIParsing' })
    return false
  }

  try {
    const [list] = await Promise.all([
      readExecutor.execute(parseProductsByQuery, { query: productsRequest.query }),
      writeExecutor.execute(updateProductsRequest, { id: params.productsRequestId, status: 'aiParsing' }),
    ])

    await writeExecutor.execute(updateProductsRequest, { id: productsRequest.id, status: 'aiParsed' })
    await writeExecutor.execute(createAiProductsList, { productsRequestId: productsRequest.id, list })
  } catch (e) {
    await writeExecutor.execute(updateProductsRequest, { id: params.productsRequestId, status: 'errorWhileAIParsing' })
    return false
  }

  return true
})
