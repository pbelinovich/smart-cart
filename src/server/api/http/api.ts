import { buildPublicDomain } from './builder'
import * as userHandlers from './user'

export const publicHttpApi = buildPublicDomain({
  user: {
    GET: {
      byTelegramId: userHandlers.getByTelegramId,
    },
    POST: {
      byTelegramId: userHandlers.getByTelegramId,
      create: userHandlers.create,
    },
  },
})
