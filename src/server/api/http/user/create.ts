import joi from 'joi'
import { buildPublicHandler } from '../builder'
import { createUser } from '../../../external'

const requestSchema = joi.object({
  telegramId: joi.number().required(),
})

export const create = buildPublicHandler(requestSchema, (params, { writeExecutor }) => {
  return writeExecutor.execute(createUser, params)
})
