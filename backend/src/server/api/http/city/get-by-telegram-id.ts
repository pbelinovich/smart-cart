import joi from 'joi'
import { buildPublicHandler } from '../builder'
import { getCityById, getUserByTelegramId, IGetUserByTelegramIdParams } from '../../../external'

const schema = joi.object<IGetUserByTelegramIdParams>({ telegramId: joi.number().required() })

export const getByTelegramId = buildPublicHandler(schema, async (params, { readExecutor }) => {
  const user = await readExecutor.execute(getUserByTelegramId, params)

  if (!user) {
    throw new Error('User does not exist')
  }

  return readExecutor.execute(getCityById, { id: user.actualCityId })
})
