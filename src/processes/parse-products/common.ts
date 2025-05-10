import joi from 'joi'
import { IUserProduct, UserPriceCategory } from '../external'

const priceCategoryMap: { [key in UserPriceCategory]: true } = {
  cheapest: true,
  popular: true,
  mostExpensive: true,
}

const productSchema = joi.object<IUserProduct>({
  name: joi.string().required(),
  quantity: joi.number().required(),
  priceCategory: joi
    .string()
    .valid(...Object.keys(priceCategoryMap))
    .required(),
})

export const productListSchema = joi.array<IUserProduct[]>().items(productSchema).required()
