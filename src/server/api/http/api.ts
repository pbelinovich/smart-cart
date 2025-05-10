import { buildPublicDomain } from './builder'
import * as userHandlers from './user'
// import * as userAddressHandlers from './user-address'
import * as marketplaceHandlers from './marketplace'

export const publicHttpApi = buildPublicDomain({
  user: {
    GET: {
      byTelegramId: userHandlers.getByTelegramId,
    },
    POST: {
      create: userHandlers.create,
    },
  },
  userAddress: {
    GET: {
      byTelegramId: userHandlers.getByTelegramId,
    },
    POST: {
      create: userHandlers.create,
    },
  },
  marketplace: {
    POST: {
      getCarts: marketplaceHandlers.getCarts,
    },
  },
})
