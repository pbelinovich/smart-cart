import joi from 'joi'
import { buildPublicHandler } from '../builder'
import {
  cancelChangeCityRequest,
  getChangeCityRequestById,
  getUserById,
  ICancelChangeCityRequestParams,
  updateUserLastActivity,
} from '../../../external'

const schema = joi.object<ICancelChangeCityRequestParams>({
  changeCityRequestId: joi.string().required(),
  userId: joi.string().required(),
})

export const cancel = buildPublicHandler(schema, async (params, { readExecutor, writeExecutor }) => {
  const user = await readExecutor.execute(getUserById, { id: params.userId })

  if (!user) {
    throw new Error('User does not exist')
  }

  const changeCityRequest = await readExecutor.execute(getChangeCityRequestById, { id: params.changeCityRequestId })

  if (!changeCityRequest) {
    throw new Error('Unable to find change city request')
  }

  if (changeCityRequest.userId !== user.id) {
    throw new Error('User does not have access to this change city request')
  }

  const [result] = await Promise.all([
    writeExecutor.execute(cancelChangeCityRequest, params),
    writeExecutor.execute(updateUserLastActivity, { id: user.id }),
  ])

  return result
})
