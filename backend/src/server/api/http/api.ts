import { buildChannel, buildPublicDomain } from './builder'
import * as cartHandlers from './cart'
import * as cartProductInStockHashHandlers from './cart-product-in-stock-hash'
import * as changeCityRequestHandlers from './change-city-request'
import * as cityHandlers from './city'
import * as presentProductHandlers from './present-product'
import * as productsRequestHandlers from './products-request'
import * as userHandlers from './user'

export const publicHttpApi = buildPublicDomain({
  cart: {
    GET: {
      byId: cartHandlers.getById,
    },
    POST: {
      getPage: cartHandlers.getPage,
      updateProductInStock: cartHandlers.updateProductInStock,
    },
  },
  cartProductInStockHash: {
    GET: {
      byHash: cartProductInStockHashHandlers.getByHash,
    },
    POST: {
      create: cartProductInStockHashHandlers.create,
    },
  },
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
  presentProduct: {
    GET: {
      byHash: presentProductHandlers.getByHash,
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
