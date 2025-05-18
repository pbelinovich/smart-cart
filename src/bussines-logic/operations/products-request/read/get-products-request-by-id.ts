import { buildGetByIdOperation } from '../../../common/read'

export const getProductsRequestById = buildGetByIdOperation(c => c.productsRequestRepo, [])
