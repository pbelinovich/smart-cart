import joi from 'joi'
import { buildPublicHandler } from '../builder'
import { IGetProductsRequestByIdParams } from './types'
import { getProductsRequestById, getUserById } from '../../../external'

const schema = joi.object<IGetProductsRequestByIdParams>({
  id: joi.string().required(),
  userId: joi.string().required(),
})

export const getById = buildPublicHandler(schema, async (params, { readExecutor }) => {
  const user = await readExecutor.execute(getUserById, { id: params.userId })

  if (!user) {
    throw new Error('User does not exist')
  }

  const productsRequest = await readExecutor.execute(getProductsRequestById, { id: params.id })

  if (!productsRequest) {
    throw new Error('Unable to find products request')
  }

  if (productsRequest.userId !== user.id) {
    throw new Error('User does not have access to this products request')
  }

  return productsRequest
})
