import { buildPublicDomain } from './builder'
import * as productHandlers from './product'
import * as productsRequestHandlers from './products-request'
import * as userHandlers from './user'

export const publicHttpApi = buildPublicDomain({
  product: {
    POST: {
      getByProductsRequestId: productHandlers.getByProductsRequestId,
    },
  },
  productsRequest: {
    POST: {
      create: productsRequestHandlers.create,
    },
  },
  user: {
    GET: {
      byTelegramId: userHandlers.getByTelegramId,
    },
    POST: {
      create: userHandlers.create,
    },
  },
})
