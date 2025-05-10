import joi from 'joi'
import { buildPublicHandler } from '../builder'
import { getUserByTelegramId, IGetUserByTelegramIdParams } from '../../../external'

const schema = joi.object<IGetUserByTelegramIdParams>({ telegramId: joi.number().required() })

export const getByTelegramId = buildPublicHandler(schema, (params, { readExecutor }) => {
  return readExecutor.execute(getUserByTelegramId, params)
})
