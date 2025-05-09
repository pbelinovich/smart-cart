import joi from 'joi'
import { IProduct, PriceCategory } from './types'

const priceCategoryMap: { [key in PriceCategory]: true } = {
  cheapest: true,
  popular: true,
  mostExpensive: true,
}

const productSchema = joi.object<IProduct>({
  product: joi.string().required(),
  quantity: joi.number().required(),
  priceCategory: joi
    .string()
    .valid(...Object.keys(priceCategoryMap))
    .required(),
})

export const productListSchema = joi.array<IProduct[]>().items(productSchema).required()
