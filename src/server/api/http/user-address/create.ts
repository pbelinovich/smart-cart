import joi from 'joi'
import { buildPublicHandler } from '../builder'
import { createUser } from '../../../external'

const schema = joi.object({
  telegramId: joi.number().required(),
})

export const create = buildPublicHandler(schema, (params, { writeExecutor }) => {
  return writeExecutor.execute(createUser, params)
})
