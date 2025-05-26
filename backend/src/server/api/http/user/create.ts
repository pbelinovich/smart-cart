import joi from 'joi'
import { buildPublicHandler } from '../builder'
import { createUser, ICreateUserParams } from '../../../external'

const schema = joi.object<ICreateUserParams>({
  telegramId: joi.number().required(),
  telegramLogin: joi.string(),
  telegramFirstName: joi.string(),
  telegramLastName: joi.string(),
})

export const create = buildPublicHandler(schema, (params, { writeExecutor }) => {
  return writeExecutor.execute(createUser, params)
})
