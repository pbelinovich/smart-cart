import { buildPublicDomain } from './builder'
import * as userHandlers from './user'
import * as edadealHandlers from './edadeal'
import * as igooodsHandlers from './igooods'

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
      // byTelegramId: userHandlers.getByTelegramId,
    },
    POST: {
      // create: userHandlers.create,
    },
  },
  edadeal: {
    POST: {
      getCarts: edadealHandlers.getCarts,
    },
  },
  igooods: {
    POST: {
      getCarts: igooodsHandlers.getCarts,
    },
  },
})
