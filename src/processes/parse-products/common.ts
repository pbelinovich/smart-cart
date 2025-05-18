import joi from 'joi'
import { IAIProduct, PriceCategory } from '../external'

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

export const productListSchema = joi.array<IAIProduct[]>().items(productSchema).required()
