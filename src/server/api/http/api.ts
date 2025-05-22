import { buildPublicDomain } from './builder'
import * as productsRequestHandlers from './products-request'
import * as userHandlers from './user'

export const publicHttpApi = buildPublicDomain({
  productsRequest: {
    GET: {
      byId: productsRequestHandlers.getById,
    },
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
