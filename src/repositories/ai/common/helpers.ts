import joi from 'joi'
import { IAIProduct, PriceCategory } from '../../types'

const priceCategoryMap: { [key in PriceCategory]: true } = {
  cheapest: true,
  popular: true,
  mostExpensive: true,
}

const productSchema = joi.object<IAIProduct>({
  name: joi.string().required(),
  quantity: joi.string().required(),
  priceCategory: joi
    .string()
    .valid(...Object.keys(priceCategoryMap))
    .required(),
})

export const productsListSchema = joi.array<IAIProduct[]>().items(productSchema).required()
