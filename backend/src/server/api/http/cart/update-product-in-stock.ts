import joi from 'joi'
import { buildPublicHandler } from '../builder'
import { updateCartProductInStock, IUpdateCartProductInStockParams } from '../../../external'

const schema = joi.object<IUpdateCartProductInStockParams>({
  cartId: joi.string().required(),
  hash: joi.string().required(),
  marketplaceId: joi.string().required(),
})

export const updateProductInStock = buildPublicHandler(schema, (params, { writeExecutor }) => {
  return writeExecutor.execute(updateCartProductInStock, params)
})
