import joi from 'joi'
import { buildPublicHandler } from '../builder'
import { getCartById, getUserById, getProductsRequestById } from '../../../external'
import { IGetCartByIdParams } from './types'

const schema = joi.object<IGetCartByIdParams>({ id: joi.string().required(), userId: joi.string().required() })

export const getById = buildPublicHandler(schema, async (params, { readExecutor }) => {
  const user = await readExecutor.execute(getUserById, { id: params.userId })

  if (!user) {
    throw new Error('User does not exist')
  }

  const cart = await readExecutor.execute(getCartById, params)

  if (!cart) {
    throw new Error('Cart does not exist')
  }

  const productsRequest = await readExecutor.execute(getProductsRequestById, { id: cart.productsRequestId })

  if (productsRequest.userId !== user.id) {
    throw new Error('User does not have access to this cart')
  }

  return cart
})
