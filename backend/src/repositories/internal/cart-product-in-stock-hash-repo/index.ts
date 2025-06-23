import { ICartProductInStockHashEntity } from './types'
import { DataBaseSession, IUpdatableRepo } from '../../types'
import { DataBaseUpdatableRepo, IQueryBuilder } from '../../external'

export * from './types'

export class CartProductInStockHashRepo
  extends DataBaseUpdatableRepo<ICartProductInStockHashEntity>
  implements IUpdatableRepo<ICartProductInStockHashEntity>
{
  static collectionName = 'cartProductInStockHashes' as const

  constructor(dbSession: DataBaseSession) {
    super(dbSession, CartProductInStockHashRepo.collectionName)
  }

  protected queryingMiddleware = (query: IQueryBuilder<ICartProductInStockHashEntity>) => {
    return query
  }

  protected getByIdMiddleware = (entity: ICartProductInStockHashEntity) => {
    return entity
  }

  protected updatingMiddleware = (entity: ICartProductInStockHashEntity) => {
    return entity
  }

  protected creationMiddleware = (entity: ICartProductInStockHashEntity) => {
    return entity
  }

  protected removingMiddleware = () => undefined
}
