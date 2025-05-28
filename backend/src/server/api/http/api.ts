import { buildChannel, buildPublicDomain } from './builder'
import * as changeCityRequestHandlers from './change-city-request'
import * as cityHandlers from './city'
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
    CHANNEL: {
      getById: buildChannel(changeCityRequestHandlers.getById, () => undefined),
    },
  },
  city: {
    GET: {
      byTelegramId: cityHandlers.getByTelegramId,
    },
  },
  productsRequest: {
    GET: {
      byId: productsRequestHandlers.getById,
    },
    POST: {
      create: productsRequestHandlers.create,
    },
    CHANNEL: {
      getById: buildChannel(productsRequestHandlers.getById, () => undefined),
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
