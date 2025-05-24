import joi from 'joi'
import { IRawAIProduct, PriceCategory } from '../../types'

const priceCategoryMap: { [key in PriceCategory]: true } = {
  cheapest: true,
  popular: true,
  mostExpensive: true,
}

const productSchema = joi.object<IRawAIProduct>({
  name: joi.string().required(),
  quantity: joi.string().required(),
  priceCategory: joi
    .string()
    .valid(...Object.keys(priceCategoryMap))
    .required(),
})

export const productsListSchema = joi.array<IRawAIProduct[]>().items(productSchema).required()
