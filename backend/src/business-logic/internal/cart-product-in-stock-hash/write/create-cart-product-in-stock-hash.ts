import { ICartProductInStockHashEntity } from '../../../external'
import { buildWriteOperation } from '../../../common/write'
import { dateTime } from '@shared'
import { generateCartProductInStockHash } from '../../../common/tools'
import { getCartProductInStockHashByHash } from '../read'

export interface ICreateCartProductInStockHashParams {
  cartId: string
  productHash: string
  marketplaceId: string
}

export const createCartProductInStockHash = buildWriteOperation(
  async (context, params: ICreateCartProductInStockHashParams, { execute }) => {
    const hash = generateCartProductInStockHash(params.cartId, params.productHash, params.marketplaceId)
    const existingCartProductInStockHash = await execute(getCartProductInStockHashByHash, { hash })

    if (existingCartProductInStockHash) {
      return existingCartProductInStockHash
    }

    const cartProductInStockHash: ICartProductInStockHashEntity = {
      id: context.cartProductInStockHashRepo.getNewId(),
      createDate: dateTime.utc().toISOString(),
      expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 46, // 46 hours
      cartId: params.cartId,
      productHash: params.productHash,
      marketplaceId: params.marketplaceId,
      hash,
    }

    return context.cartProductInStockHashRepo.create(cartProductInStockHash)
  },
  []
)
