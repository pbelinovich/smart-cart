import joi from 'joi'
import { buildPublicHandler } from '../builder'
import { IGetChangeCityRequestByIdParams } from './types'
import { getChangeCityRequestById, getUserById } from '../../../external'

const schema = joi.object<IGetChangeCityRequestByIdParams>({
  id: joi.string().required(),
  userId: joi.string().required(),
})

export const getById = buildPublicHandler(schema, async (params, { readExecutor }) => {
  const user = await readExecutor.execute(getUserById, { id: params.userId })

  if (!user) {
    throw new Error('User does not exist')
  }

  const changeCityRequest = await readExecutor.execute(getChangeCityRequestById, { id: params.id })

  if (!changeCityRequest) {
    throw new Error('Unable to find change city request')
  }

  if (changeCityRequest.userId !== user.id) {
    throw new Error('User does not have access to this change city request')
  }

  return changeCityRequest
})
