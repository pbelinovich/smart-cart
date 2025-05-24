import joi from 'joi'
import { buildPublicHandler } from '../builder'
import { createChangeCityRequest, getUserById, ICreateChangeCityRequestParams, updateUserLastActivity } from '../../../external'

const schema = joi.object<ICreateChangeCityRequestParams>({
  userId: joi.string().required(),
  query: joi
    .string()
    .max(100) // Максимальная длина — 100 символов
    .regex(/^[a-zA-Zа-яА-ЯёЁ0-9\s.,!?:;"'()\-–—]+$/) // Буквы, цифры, пробелы, пунктуация
    .messages({
      'string.max': 'Длина запроса не должна превышать 300 символов',
      'string.pattern.base': 'Допустимы только русские и английские буквы, а также пробелы',
    })
    .required(),
})

export const create = buildPublicHandler(schema, async (params, { readExecutor, writeExecutor }) => {
  const user = await readExecutor.execute(getUserById, { id: params.userId })

  if (!user) {
    throw new Error('User does not exist')
  }

  const [result] = await Promise.all([
    writeExecutor.execute(createChangeCityRequest, params),
    writeExecutor.execute(updateUserLastActivity, { id: user.id }),
  ])

  return result
})
