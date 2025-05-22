import { buildPublicDomain } from './builder'
import * as changeCityRequestHandlers from './change-city-request'
import * as productsRequestHandlers from './products-request'
import * as userHandlers from './user'

export const publicHttpApi = buildPublicDomain({
  changeCityRequest: {
    GET: {
      byId: changeCityRequestHandlers.getById,
    },
    POST: {
      cancel: changeCityRequestHandlers.cancel,
      create: changeCityRequestHandlers.create,
      selectCity: changeCityRequestHandlers.selectCity,
    },
  },
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
