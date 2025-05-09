import joi from 'joi'
import { buildPublicHandler } from '../builder'
import { getUserByTelegramId, IGetUserByTelegramIdParams } from '../../../external'

const schema = joi.object<IGetUserByTelegramIdParams>({ telegramId: joi.number().required() })

export const getByTelegramId = buildPublicHandler(schema, async (params, { readExecutor, process }) => {
  const res = await process.request('stringToFoodList', 'молоко нормальное, хлеб и яйца самые дешевые, туалетная бумага zewa')
  console.log('!!res', res)

  return readExecutor.execute(getUserByTelegramId, params)
})
