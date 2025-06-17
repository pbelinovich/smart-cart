import { ICartEntity, ProductInStock, ProductIsOutOfStock } from '../../../external'
import { buildWriteOperation } from '../../../common/write'
import { dateTime } from '@shared'
import { getDefaultCity } from '../../city'

export interface ICreateCartParams {
  productsRequestId: string
  shopId: string
  shopName: string
  productsInStock: ProductInStock[]
  productsAreOutOfStock: ProductIsOutOfStock[]
}

export const createCart = buildWriteOperation(async (context, params: ICreateCartParams, { execute }) => {
  const defaultCity = await execute(getDefaultCity, {})

  if (!defaultCity) {
    throw new Error('Default city not found')
  }

  const cart: ICartEntity = {
    id: context.cartRepo.getNewId(),
    productsRequestId: params.productsRequestId,
    createDate: dateTime.utc().toISOString(),
    shopId: params.shopId,
    shopName: params.shopName,
    productsInStock: { data: params.productsInStock, total: params.productsInStock.length },
    productsAreOutOfStock: { data: params.productsAreOutOfStock, total: params.productsAreOutOfStock.length },
    totalPrice: params.productsInStock.reduce((acc, product) => acc + product.marketplacePrice * product.quantity, 0),
  }

  return context.cartRepo.create(cart)
}, [])
