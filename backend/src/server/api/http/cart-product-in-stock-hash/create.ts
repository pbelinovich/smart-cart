import joi from 'joi'
import { buildPublicHandler } from '../builder'
import { ICreateCartProductInStockHashParams, createCartProductInStockHash } from '../../../external'

const schema = joi.object<ICreateCartProductInStockHashParams>({
  cartId: joi.string().required(),
  productHash: joi.string().required(),
  marketplaceId: joi.string().required(),
})

export const create = buildPublicHandler(schema, (params, { writeExecutor }) => {
  return writeExecutor.execute(createCartProductInStockHash, params)
})
